import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { CH } from '../shared/channels'
import type {
  AppConfig,
  BatchRequest,
  IpcResult,
  OptimizeProgress,
  OptimizeRequest,
  OptimizeResult,
  PosterUrlRequest,
  PublishRequest,
  UploadRequest
} from '../shared/ipc'
import { config } from './services/config'
import * as ffmpegSvc from './services/ffmpeg'
import * as cloud from './services/cloudinary'
import * as gh from './services/github'
import { randomUUID } from 'crypto'

let mainWindow: BrowserWindow | null = null
let currentAppUrl = ''
const jobs = new Map<string, ffmpegSvc.OptimizeHandle>()

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 900,
    minHeight: 640,
    show: false,
    title: 'Sarrah Portfolio Manager',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // The preload exposes privileged APIs (commit, upload, saveConfig) to whatever
  // document is loaded, so the window must never navigate away from the app itself.
  // Dropping a file or link onto the window would otherwise navigate it.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== currentAppUrl) event.preventDefault()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    currentAppUrl = process.env.ELECTRON_RENDERER_URL
    mainWindow.loadURL(currentAppUrl)
  } else {
    const indexPath = join(__dirname, '../renderer/index.html')
    currentAppUrl = pathToFileURL(indexPath).toString()
    mainWindow.loadFile(indexPath)
  }
}

async function wrap<T>(fn: () => Promise<T> | T): Promise<IpcResult<T>> {
  try {
    return { ok: true, value: await fn() }
  } catch (err) {
    const code = (err as { code?: string }).code
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message, code }
  }
}

function registerIpc(): void {
  ipcMain.handle(CH.configGet, () => config.toPublic())

  ipcMain.handle(CH.configSave, (_e, input: Partial<AppConfig>) =>
    wrap(() => {
      config.save(input)
      return config.toPublic()
    })
  )

  ipcMain.handle(CH.connectionCheck, () =>
    wrap(async () => ({
      cloudinary: await cloud.ping(),
      github: await gh.ping()
    }))
  )

  ipcMain.handle(CH.pickFile, async (_e, kind: 'video' | 'image') => {
    const filters =
      kind === 'video'
        ? [{ name: 'Videos', extensions: ['mov', 'mp4', 'm4v', 'webm', 'avi'] }]
        : [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }]
    const res = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters
    })
    return res.canceled ? null : res.filePaths[0]
  })

  ipcMain.handle(CH.optimizeStart, (_e, req: OptimizeRequest) =>
    wrap<OptimizeResult>(() => {
      const jobId = randomUUID()
      const handle = ffmpegSvc.optimizeVideo(
        jobId,
        req.inputPath,
        req.preset,
        (p: OptimizeProgress) => {
          mainWindow?.webContents.send(CH.optimizeProgress, p)
        }
      )
      jobs.set(jobId, handle)
      return handle.promise.finally(() => jobs.delete(jobId))
    })
  )

  ipcMain.handle(CH.optimizeCancel, (_e, jobId: string) => {
    jobs.get(jobId)?.cancel()
    return { ok: true }
  })

  ipcMain.handle(CH.uploadMedia, (_e, req: UploadRequest) =>
    wrap(() =>
      cloud.uploadMedia(req.filePath, req.collection, req.resourceType, req.publicId)
    )
  )

  ipcMain.handle(CH.posterUrl, (_e, req: PosterUrlRequest) =>
    wrap(() => cloud.posterUrl(req.publicId, req.offsetSec))
  )

  ipcMain.handle(CH.sync, () => wrap(() => gh.sync()))

  ipcMain.handle(CH.publish, (_e, req: PublishRequest & { baseSha: string }) =>
    wrap(() =>
      gh.commitBatch(
        [
          {
            type: 'upsert',
            collection: req.collection,
            slug: req.slug,
            path: '',
            data: req.data
          }
        ],
        req.commitMessage,
        req.baseSha
      )
    )
  )

  ipcMain.handle(CH.commitBatch, (_e, req: BatchRequest) =>
    wrap(() => gh.commitBatch(req.changes, req.commitMessage, req.baseSha))
  )

  ipcMain.handle(CH.deploymentStatus, (_e, commitSha: string) =>
    wrap(() => gh.deploymentStatus(commitSha))
  )

  ipcMain.handle(CH.deploymentRetry, (_e, runId: number) =>
    wrap(() => gh.retryDeployment(runId))
  )

  ipcMain.handle(CH.openExternal, (_e, url: string) => shell.openExternal(url))
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
