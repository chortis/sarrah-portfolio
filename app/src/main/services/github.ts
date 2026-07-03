import { Octokit } from '@octokit/rest'
import matter from 'gray-matter'
import {
  COLLECTION_LIST,
  COLLECTIONS,
  type CollectionId,
  type ContentItem,
  type Frontmatter
} from '../../shared/collections'
import type {
  BatchChange,
  CommitResult,
  SyncResult
} from '../../shared/ipc'
import { config } from './config'
import { serialize } from './markdown'

function client(): { octokit: Octokit; owner: string; repo: string; branch: string } {
  const c = config.load()
  return {
    octokit: new Octokit({ auth: c.githubToken }),
    owner: c.githubOwner,
    repo: c.githubRepo,
    branch: c.githubBranch
  }
}

const CONTENT_DIRS = new Set(COLLECTION_LIST.map((c) => c.contentDir))

function collectionForPath(path: string): CollectionId | null {
  for (const def of COLLECTION_LIST) {
    if (path.startsWith(def.contentDir + '/') && path.endsWith('.md')) {
      return def.id
    }
  }
  return null
}

/** Fetch the latest content of all collections from the target branch. */
export async function sync(): Promise<SyncResult> {
  const { octokit, owner, repo, branch } = client()

  const ref = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` })
  const headSha = ref.data.object.sha

  const commit = await octokit.git.getCommit({ owner, repo, commit_sha: headSha })
  const tree = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: commit.data.tree.sha,
    recursive: 'true'
  })

  const mdFiles = tree.data.tree.filter(
    (t) => t.type === 'blob' && t.path && collectionForPath(t.path) !== null
  )

  const items = await Promise.all(
    mdFiles.map(async (f) => {
      const blob = await octokit.git.getBlob({
        owner,
        repo,
        file_sha: f.sha as string
      })
      const raw = Buffer.from(blob.data.content, 'base64').toString('utf8')
      const data = matter(raw).data as Frontmatter
      const path = f.path as string
      const collection = collectionForPath(path) as CollectionId
      const slug = path.slice(path.lastIndexOf('/') + 1, -'.md'.length)
      return { path, slug, collection, data, sha: f.sha as string } as ContentItem
    })
  )

  items.sort((a, b) => {
    if (a.collection !== b.collection) return a.collection.localeCompare(b.collection)
    return (a.data.order ?? 0) - (b.data.order ?? 0)
  })

  return { headSha, items, syncedAt: new Date().toISOString() }
}

/**
 * Apply a set of upsert/delete changes as a single atomic commit on the branch.
 * Guards against stale writes: if the branch head moved past `baseSha`, throws.
 */
export async function commitBatch(
  changes: BatchChange[],
  message: string,
  baseSha: string
): Promise<CommitResult> {
  const { octokit, owner, repo, branch } = client()

  const ref = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` })
  const headSha = ref.data.object.sha
  if (baseSha && headSha !== baseSha) {
    throw new StaleError(
      'The site changed since you last refreshed. Please refresh and try again.'
    )
  }

  const baseCommit = await octokit.git.getCommit({ owner, repo, commit_sha: headSha })
  const baseTreeSha = baseCommit.data.tree.sha

  const tree: {
    path: string
    mode: '100644'
    type: 'blob'
    sha?: string | null
    content?: string
  }[] = []

  for (const change of changes) {
    const path = pathFor(change)
    if (change.type === 'delete') {
      tree.push({ path, mode: '100644', type: 'blob', sha: null })
    } else {
      if (!change.data) throw new Error(`Missing data for upsert ${path}`)
      tree.push({
        path,
        mode: '100644',
        type: 'blob',
        content: serialize(change.collection, change.data)
      })
    }
  }

  const newTree = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree
  })

  const newCommit = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.data.sha,
    parents: [headSha]
  })

  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.data.sha
  })

  return {
    commitSha: newCommit.data.sha,
    htmlUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.data.sha}`
  }
}

function pathFor(change: BatchChange): string {
  const dir = COLLECTIONS[change.collection].contentDir
  return `${dir}/${change.slug}.md`
}

/** Verify the GitHub token can access the repo and branch. */
export async function ping(): Promise<{ ok: boolean; message: string }> {
  try {
    const { octokit, owner, repo, branch } = client()
    await octokit.repos.get({ owner, repo })
    await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` })
    return { ok: true, message: `Connected to ${owner}/${repo} (${branch})` }
  } catch (err) {
    return { ok: false, message: friendly(err) }
  }
}

export class StaleError extends Error {
  code = 'STALE'
}

function friendly(err: unknown): string {
  const status = (err as { status?: number }).status
  if (status === 401) return 'GitHub token is invalid or expired. Please update it in Settings.'
  if (status === 403) return 'GitHub token lacks permission for this repository.'
  if (status === 404) return 'Repository or branch not found. Check the settings.'
  const msg = err instanceof Error ? err.message : String(err)
  return `Could not reach GitHub: ${msg}`
}

export { CONTENT_DIRS }
