// Central list of IPC channel names shared by main and preload.
export const CH = {
  configGet: 'config:get',
  configSave: 'config:save',
  connectionCheck: 'config:check',

  pickFile: 'dialog:pickFile',

  optimizeStart: 'ffmpeg:optimize',
  optimizeCancel: 'ffmpeg:cancel',
  optimizeProgress: 'ffmpeg:progress', // main -> renderer event

  uploadMedia: 'cloudinary:upload',
  posterUrl: 'cloudinary:posterUrl',

  sync: 'github:sync',
  publish: 'github:publish',
  commitBatch: 'github:commitBatch',
  deploymentStatus: 'github:deploymentStatus',
  deploymentRetry: 'github:deploymentRetry',

  openExternal: 'shell:openExternal'
} as const

export type Channel = (typeof CH)[keyof typeof CH]
