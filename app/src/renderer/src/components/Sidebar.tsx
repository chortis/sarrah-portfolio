import { COLLECTION_LIST } from '../../../shared/collections'
import { useStore } from '../lib/store'
import type { View } from '../App'

const ICONS: Record<string, string> = {
  portfolio: '🎬',
  private: '🔒',
  drawings: '🎨',
  'private-drawings': '🖼️'
}

export function Sidebar({
  view,
  onNavigate
}: {
  view: View
  onNavigate: (v: View) => void
}): JSX.Element {
  const { itemsFor } = useStore()

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-title">Portfolio Manager</div>
        <div className="brand-sub">Sarrah Campbell</div>
      </div>

      <nav className="nav">
        <div className="nav-group-label">Content</div>
        {COLLECTION_LIST.map((c) => (
          <button
            key={c.id}
            className={`nav-item ${view === c.id ? 'active' : ''}`}
            onClick={() => onNavigate(c.id)}
          >
            <span className="nav-icon">{ICONS[c.id]}</span>
            <span className="nav-label">{c.label}</span>
            <span className="nav-count">{itemsFor(c.id).length}</span>
          </button>
        ))}
      </nav>

      <div className="nav-footer">
        <button
          className={`nav-item ${view === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </button>
      </div>
    </aside>
  )
}
