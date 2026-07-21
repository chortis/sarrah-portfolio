import { useState } from 'react'
import { COLLECTIONS, type ContentItem } from '../../../shared/collections'
import type {
  Frontmatter,
  ImageFrontmatter,
  VideoFrontmatter
} from '../../../shared/collections'
import { useStore } from '../lib/store'
import { unwrap } from '../lib/api'
import { TimeRangeHelper } from '../components/TimeRangeHelper'

export function EditModal({
  item,
  onClose
}: {
  item: ContentItem
  onClose: () => void
}): JSX.Element {
  const def = COLLECTIONS[item.collection]
  const isVideo = def.media === 'video'
  const { sync, refresh, toast } = useStore()

  const v = item.data as VideoFrontmatter
  const im = item.data as ImageFrontmatter

  const [title, setTitle] = useState(v.title ?? '')
  const [description, setDescription] = useState(
    isVideo ? v.description ?? '' : im.description ?? ''
  )
  const [alt, setAlt] = useState(im.alt ?? '')
  const [project, setProject] = useState(im.project ?? '')
  const [lock, setLock] = useState(Boolean(v.lock))
  const [full, setFull] = useState(Boolean(im.full))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function build(): Frontmatter {
    if (isVideo) {
      const fm: VideoFrontmatter = {
        ...v,
        title: title.trim(),
        description: description.trim(),
        lock
      }
      return fm
    }
    const fm: ImageFrontmatter = { ...im, alt: alt.trim(), full }
    if (item.collection === 'private-drawings') {
      fm.project = project.trim()
      if (description.trim()) fm.description = description.trim()
      else delete fm.description
    }
    return fm
  }

  async function save(): Promise<void> {
    if (!sync) return
    setSaving(true)
    setError(null)
    try {
      const res = await unwrap(
        window.api.commitBatch({
          changes: [
            {
              type: 'upsert',
              collection: item.collection,
              slug: item.slug,
              path: item.path,
              data: build()
            }
          ],
          commitMessage: `Update ${isVideo ? title : alt}`,
          baseSha: sync.headSha
        })
      )
      toast({
        kind: 'success',
        message: 'Saved! Your website will update shortly.',
        actionUrl: res.htmlUrl,
        actionLabel: 'View change'
      })
      await refresh()
      onClose()
    } catch (err) {
      const e = err as { code?: string }
      if (e.code === 'STALE') void refresh()
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const canSave = isVideo
    ? Boolean(title.trim())
    : Boolean(alt.trim()) &&
      (item.collection !== 'private-drawings' || Boolean(project.trim()))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Edit</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="banner error">{error}</div>}
        <div className="modal-body">
          {isVideo ? (
            <>
              <label className="field">
                <span>Title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="field">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              {def.isPrivate && (
                <TimeRangeHelper
                  onInsert={(t) => setDescription((d) => (d ? `${d} ${t}` : t))}
                />
              )}
              {def.hasLock && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={lock}
                    onChange={(e) => setLock(e.target.checked)}
                  />
                  <span>Password-protect this item (locked)</span>
                </label>
              )}
            </>
          ) : (
            <>
              <label className="field">
                <span>Description (alt text)</span>
                <input value={alt} onChange={(e) => setAlt(e.target.value)} />
              </label>
              {item.collection === 'private-drawings' && (
                <>
                  <label className="field">
                    <span>Project</span>
                    <input value={project} onChange={(e) => setProject(e.target.value)} />
                  </label>
                  <label className="field">
                    <span>Notes (optional)</span>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>
                </>
              )}
              <label className="check">
                <input
                  type="checkbox"
                  checked={full}
                  onChange={(e) => setFull(e.target.checked)}
                />
                <span>Display full-width</span>
              </label>
            </>
          )}
          <div className="modal-actions">
            <button className="btn ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn primary" onClick={save} disabled={!canSave || saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
