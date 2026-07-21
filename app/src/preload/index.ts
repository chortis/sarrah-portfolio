import { contextBridge, ipcRenderer } from 'electron'
import { CH } from '../shared/channels'
import type {
  AppConfig,
  BatchRequest,
  CommitResult,
  ConnectionCheck,
  IpcResult,
  OptimizeProgress,
  OptimizeRequest,
  OptimizeResult,
  PosterUrlRequest,
  PublicConfig,
  PublishRequest,
  SyncResult,
  UploadRequest,
  UploadResult
} from '../shared/ipc'

const api = {
  getConfig: (): Promise<PublicConfig> => ipcRenderer.invoke(CH.configGet),
  saveConfig: (input: Partial<AppConfig>): Promise<IpcResult<PublicConfig>> =>
    ipcRenderer.invoke(CH.configSave, input),
  checkConnections: (): Promise<IpcResult<ConnectionCheck>> =>
    ipcRenderer.invoke(CH.connectionCheck),

  pickFile: (kind: 'video' | 'image'): Promise<string | null> =>
    ipcRenderer.invoke(CH.pickFile, kind),

  optimize: (req: OptimizeRequest): Promise<IpcResult<OptimizeResult>> =>
    ipcRenderer.invoke(CH.optimizeStart, req),
  cancelOptimize: (jobId: string): Promise<void> =>
    ipcRenderer.invoke(CH.optimizeCancel, jobId),
  onOptimizeProgress: (cb: (p: OptimizeProgress) => void): (() => void) => {
    const listener = (_e: unknown, p: OptimizeProgress): void => cb(p)
    ipcRenderer.on(CH.optimizeProgress, listener)
    return () => ipcRenderer.removeListener(CH.optimizeProgress, listener)
  },

  upload: (req: UploadRequest): Promise<IpcResult<UploadResult>> =>
    ipcRenderer.invoke(CH.uploadMedia, req),
  posterUrl: (req: PosterUrlRequest): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(CH.posterUrl, req),

  sync: (): Promise<IpcResult<SyncResult>> => ipcRenderer.invoke(CH.sync),
  publish: (
    req: PublishRequest & { baseSha: string }
  ): Promise<IpcResult<CommitResult>> => ipcRenderer.invoke(CH.publish, req),
  commitBatch: (req: BatchRequest): Promise<IpcResult<CommitResult>> =>
    ipcRenderer.invoke(CH.commitBatch, req),

  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke(CH.openExternal, url)
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
