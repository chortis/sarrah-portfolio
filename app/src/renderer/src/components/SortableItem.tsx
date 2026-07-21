import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ContentItem, VideoFrontmatter, ImageFrontmatter } from '../../../shared/collections'
import { COLLECTIONS } from '../../../shared/collections'

export function SortableItem({
  item,
  onEdit,
  onDelete
}: {
  item: ContentItem
  onEdit: (i: ContentItem) => void
  onDelete: (i: ContentItem) => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.path })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const media = COLLECTIONS[item.collection].media
  const isVideo = media === 'video'
  const v = item.data as VideoFrontmatter
  const im = item.data as ImageFrontmatter
  const title = isVideo ? v.title : im.alt
  const thumb = isVideo ? v.poster : im.image
  const locked = isVideo ? v.lock : false

  return (
    <div ref={setNodeRef} style={style} className="row">
      <button className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
        ⠿
      </button>
      <div className="row-thumb">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" />
        ) : (
          <div className="thumb-placeholder">{isVideo ? '🎬' : '🖼️'}</div>
        )}
      </div>
      <div className="row-main">
        <div className="row-title">
          {title}
          {locked && <span className="tag">🔒 Locked</span>}
        </div>
        <div className="row-sub">
          {isVideo ? v.description : im.description || item.slug}
        </div>
      </div>
      <div className="row-actions">
        <button className="btn small" onClick={() => onEdit(item)}>
          Edit
        </button>
        <button className="btn small danger" onClick={() => onDelete(item)}>
          Delete
        </button>
      </div>
    </div>
  )
}
