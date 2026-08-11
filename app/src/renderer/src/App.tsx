import { useState } from 'react'
import { StoreProvider, useStore } from './lib/store'
import { COLLECTION_LIST } from '../../shared/collections'
import type { CollectionId } from '../../shared/collections'
import { Sidebar } from './components/Sidebar'
import { Toasts } from './components/Toasts'
import { SettingsView } from './views/SettingsView'
import { CollectionView } from './views/CollectionView'
import { timeAgo } from './lib/format'
import type { DeploymentStatus } from '../../shared/ipc'

export type View = CollectionId | 'settings'

function Shell(): JSX.Element {
  const {
    config,
    sync,
    loading,
    refresh,
    deployment,
    retryDeployment,
    retryingDeployment
  } = useStore()
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
          <div className="topbar-actions">
            {deployment && (
              <div className={`deploy-status ${deploymentTone(deployment)}`}>
                <span className={`dot ${deploymentPulse(deployment)}`} />
                <span title={deployment.error ?? undefined}>
                  {deploymentLabel(deployment)}
                </span>
                {deployment.htmlUrl && (
                  <button
                    className="link-button"
                    onClick={() => window.api.openExternal(deployment.htmlUrl!)}
                  >
                    View progress
                  </button>
                )}
                {deployment.canRetry && (
                  <button
                    className="btn small"
                    onClick={() => retryDeployment()}
                    disabled={retryingDeployment}
                  >
                    {retryingDeployment ? 'Retrying update…' : 'Retry update'}
                  </button>
                )}
              </div>
            )}
            <button className="btn ghost" onClick={() => refresh()} disabled={loading}>
              ↻ Refresh
            </button>
          </div>
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

function deploymentLabel(deployment: DeploymentStatus): string {
  if (deployment.status === 'error') return 'Live site update unavailable'
  if (deployment.status === 'waiting') return 'Waiting to update live site'
  if (
    deployment.status === 'requested' ||
    deployment.status === 'pending' ||
    deployment.status === 'queued'
  ) {
    return 'Live site update queued'
  }
  if (deployment.status === 'in_progress') return 'Updating live site…'
  if (deployment.conclusion === 'success') return 'Live site is up to date'
  if (deployment.needsAssistance) return 'Ask Curtis'
  return 'Live site update failed'
}

function deploymentTone(deployment: DeploymentStatus): string {
  if (deployment.status === 'error') return 'failure'
  if (deployment.status !== 'completed') return 'running'
  return deployment.conclusion === 'success' ? 'success' : 'failure'
}

function deploymentPulse(deployment: DeploymentStatus): string {
  if (deployment.status === 'error') return 'failed'
  if (deployment.status !== 'completed') return 'pulsing'
  return deployment.conclusion === 'success' ? 'ok' : 'failed'
}
