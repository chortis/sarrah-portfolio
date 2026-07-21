import matter from 'gray-matter'
import {
  COLLECTIONS,
  type CollectionId,
  type Frontmatter,
  type ImageFrontmatter,
  type VideoFrontmatter
} from '../../shared/collections'

/** Serialize frontmatter to a markdown file body (frontmatter only, no content). */
export function serialize(collection: CollectionId, data: Frontmatter): string {
  const ordered = orderFields(collection, data)
  // gray-matter stringifies with a trailing content arg; we use an empty body.
  return matter.stringify('', ordered)
}

/** Parse a markdown file into typed frontmatter. */
export function parse(raw: string): Record<string, unknown> {
  return matter(raw).data
}

/**
 * Produce a plain object with keys in a stable, human-friendly order matching the
 * hand-written files in the repo, omitting empty optional fields.
 */
function orderFields(
  collection: CollectionId,
  data: Frontmatter
): Record<string, unknown> {
  const media = COLLECTIONS[collection].media
  if (media === 'video') {
    const v = data as VideoFrontmatter
    const out: Record<string, unknown> = {
      title: v.title,
      description: v.description,
      video: v.video
    }
    if (v.poster) out.poster = v.poster
    out.order = v.order
    if (v.lock) out.lock = true
    return out
  }
  const i = data as ImageFrontmatter
  const out: Record<string, unknown> = {
    alt: i.alt,
    image: i.image
  }
  if (collection === 'private-drawings') {
    out.project = i.project ?? ''
    if (i.description) out.description = i.description
  }
  out.order = i.order
  if (i.full) out.full = true
  return out
}

/** Turn a title/alt into a filesystem-safe slug. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'item'
}

/** Ensure a slug is unique within a set of existing slugs. */
export function uniqueSlug(desired: string, existing: Set<string>): string {
  if (!existing.has(desired)) return desired
  let n = 2
  while (existing.has(`${desired}-${n}`)) n++
  return `${desired}-${n}`
}
