import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { PublicConfig, SyncResult } from '../../../shared/ipc'
import type { ContentItem } from '../../../shared/collections'
import { unwrap } from './api'

export interface Toast {
  id: number
  kind: 'info' | 'success' | 'error'
  message: string
  actionUrl?: string
  actionLabel?: string
}

interface StoreValue {
  config: PublicConfig | null
  sync: SyncResult | null
  loading: boolean
  syncError: string | null
  refresh: () => Promise<void>
  reloadConfig: () => Promise<void>
  itemsFor: (collection: string) => ContentItem[]
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
}

const StoreContext = createContext<StoreValue | null>(null)

let toastSeq = 1

export function StoreProvider({ children }: { children: ReactNode }): ReactNode {
  const [config, setConfig] = useState<PublicConfig | null>(null)
  const [sync, setSync] = useState<SyncResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = toastSeq++
    setToasts((prev) => [...prev, { ...t, id }])
    if (t.kind !== 'error') {
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 6000)
    }
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const reloadConfig = useCallback(async () => {
    setConfig(await window.api.getConfig())
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setSyncError(null)
    try {
      const result = await unwrap(window.api.sync())
      setSync(result)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // On open: load config, then auto-fetch latest content if configured.
  useEffect(() => {
    void (async () => {
      const cfg = await window.api.getConfig()
      setConfig(cfg)
      if (cfg.configured) await refresh()
    })()
  }, [refresh])

  const itemsFor = useCallback(
    (collection: string): ContentItem[] =>
      (sync?.items ?? []).filter((i) => i.collection === collection),
    [sync]
  )

  const value: StoreValue = {
    config,
    sync,
    loading,
    syncError,
    refresh,
    reloadConfig,
    itemsFor,
    toasts,
    toast,
    dismissToast
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
