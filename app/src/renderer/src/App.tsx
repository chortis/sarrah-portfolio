import { useState } from 'react'
import { StoreProvider, useStore } from './lib/store'
import { COLLECTION_LIST } from '../../shared/collections'
import type { CollectionId } from '../../shared/collections'
import { Sidebar } from './components/Sidebar'
import { Toasts } from './components/Toasts'
import { SettingsView } from './views/SettingsView'
import { CollectionView } from './views/CollectionView'
import { timeAgo } from './lib/format'

export type View = CollectionId | 'settings'

function Shell(): JSX.Element {
  const { config, sync, loading, refresh } = useStore()
  const [view, setView] = useState<View>('portfolio')

  if (!config) {
    return <div className="splash">Loading…</div>
  }

  // First-run: force setup until configured.
  if (!config.configured) {
    return (
      <div className="app">
        <Toasts />
        <main className="content setup-first-run">
          <SettingsView firstRun />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <Sidebar view={view} onNavigate={setView} />
      <main className="content">
        <header className="topbar">
          <div className="sync-status">
            {loading ? (
              <span className="dot pulsing" />
            ) : (
              <span className="dot ok" />
            )}
            <span>
              {loading
                ? 'Refreshing…'
                : sync
                  ? `Up to date · synced ${timeAgo(sync.syncedAt)}`
                  : 'Not synced'}
            </span>
          </div>
          <button className="btn ghost" onClick={() => refresh()} disabled={loading}>
            ↻ Refresh
          </button>
        </header>
        <div className="view">
          {view === 'settings' ? (
            <SettingsView />
          ) : (
            <CollectionView collection={view} />
          )}
        </div>
      </main>
      <Toasts />
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

export { COLLECTION_LIST }
