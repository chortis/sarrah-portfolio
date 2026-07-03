import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { COLLECTIONS, type CollectionId, type ContentItem } from '../../../shared/collections'
import type { BatchChange } from '../../../shared/ipc'
import { useStore } from '../lib/store'
import { unwrap } from '../lib/api'
import { SortableItem } from '../components/SortableItem'
import { AddWizard } from './AddWizard'
import { EditModal } from './EditModal'

export function CollectionView({ collection }: { collection: CollectionId }): JSX.Element {
  const { itemsFor, sync, refresh, toast, loading, syncError } = useStore()
  const def = COLLECTIONS[collection]
  const serverItems = itemsFor(collection)

  const [order, setOrder] = useState<ContentItem[]>(serverItems)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<ContentItem | null>(null)

  // Keep local order in sync with server data whenever it changes.
  useEffect(() => {
    setOrder(serverItems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync, collection])

  const dirty = useMemo(
    () => order.some((it, idx) => it.path !== serverItems[idx]?.path),
    [order, serverItems]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function onDragEnd(e: DragEndEvent): void {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setOrder((items) => {
      const from = items.findIndex((i) => i.path === active.id)
      const to = items.findIndex((i) => i.path === over.id)
      return arrayMove(items, from, to)
    })
  }

  async function saveOrder(): Promise<void> {
    if (!sync) return
    setSaving(true)
    try {
      const changes: BatchChange[] = []
      order.forEach((item, idx) => {
        const newOrder = idx + 1
        if (item.data.order !== newOrder) {
          changes.push({
            type: 'upsert',
            collection,
            slug: item.slug,
            path: item.path,
            data: { ...item.data, order: newOrder }
          })
        }
      })
      if (changes.length === 0) {
        setSaving(false)
        return
      }
      const res = await unwrap(
        window.api.commitBatch({
          changes,
          commitMessage: `Reorder ${def.label.toLowerCase()}`,
          baseSha: sync.headSha
        })
      )
      toast({
        kind: 'success',
        message: 'New order saved! Your website will update in a few minutes.',
        actionUrl: res.htmlUrl,
        actionLabel: 'View change'
      })
      await refresh()
    } catch (err) {
      handleErr(err)
    } finally {
      setSaving(false)
    }
  }

  async function doDelete(item: ContentItem): Promise<void> {
    if (!sync) return
    const ok = window.confirm(
      `Delete “${label(item)}”? This removes it from the website. This cannot be undone from the app.`
    )
    if (!ok) return
    try {
      const res = await unwrap(
        window.api.commitBatch({
          changes: [
            { type: 'delete', collection, slug: item.slug, path: item.path }
          ],
          commitMessage: `Remove ${label(item)}`,
          baseSha: sync.headSha
        })
      )
      toast({
        kind: 'success',
        message: 'Removed. Your website will update shortly.',
        actionUrl: res.htmlUrl,
        actionLabel: 'View change'
      })
      await refresh()
    } catch (err) {
      handleErr(err)
    }
  }

  function handleErr(err: unknown): void {
    const e = err as { code?: string; message?: string }
    if (e.code === 'STALE') {
      toast({ kind: 'error', message: e.message ?? 'Please refresh and try again.' })
      void refresh()
    } else {
      toast({ kind: 'error', message: e.message ?? String(err) })
    }
  }

  return (
    <div className="collection">
      <div className="collection-head">
        <div>
          <h1>{def.label}</h1>
          <p className="muted">
            {def.media === 'video' ? 'Videos' : 'Images'} shown on the site, in order.
            Drag ⠿ to reorder.
          </p>
        </div>
        <div className="head-actions">
          {dirty && (
            <button className="btn primary" onClick={saveOrder} disabled={saving}>
              {saving ? 'Saving…' : 'Save new order'}
            </button>
          )}
          <button className="btn" onClick={() => setAdding(true)}>
            + Add {def.media === 'video' ? 'video' : 'image'}
          </button>
        </div>
      </div>

      {syncError && <div className="banner error">{syncError}</div>}

      {order.length === 0 && !loading ? (
        <div className="empty">
          <div className="empty-icon">{def.media === 'video' ? '🎬' : '🖼️'}</div>
          <p>Nothing here yet. Click “Add” to publish your first one.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order.map((i) => i.path)} strategy={verticalListSortingStrategy}>
            <div className="rows">
              {order.map((item) => (
                <SortableItem
                  key={item.path}
                  item={item}
                  onEdit={setEditing}
                  onDelete={doDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {adding && (
        <AddWizard collection={collection} onClose={() => setAdding(false)} />
      )}
      {editing && (
        <EditModal item={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function label(item: ContentItem): string {
  const d = item.data as { title?: string; alt?: string }
  return d.title ?? d.alt ?? item.slug
}
