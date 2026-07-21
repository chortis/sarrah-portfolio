// Shared types for the IPC contract between renderer and main.
import type { CollectionId, ContentItem, Frontmatter } from './collections'

/** Cloudinary + GitHub configuration. Secrets never leave the main process. */
export interface AppConfig {
  cloudinaryCloudName: string
  cloudinaryApiKey: string
  cloudinaryApiSecret: string
  githubToken: string
}

/** Config with secrets redacted, safe to send to the renderer. */
export interface PublicConfig {
  cloudinaryCloudName: string
  githubOwner: string
  githubRepo: string
  githubBranch: string
  configured: boolean
  /** Which secret fields are present (booleans only, never the values). */
  hasCloudinaryKey: boolean
  hasCloudinarySecret: boolean
  hasGithubToken: boolean
}

export interface ConnectionCheck {
  cloudinary: { ok: boolean; message: string }
  github: { ok: boolean; message: string }
}

/** ffmpeg optimization presets. */
export type FfmpegPreset = 'balanced' | 'smaller' | 'quality'

export interface OptimizeRequest {
  inputPath: string
  preset: FfmpegPreset
}

export interface OptimizeResult {
  outputPath: string
  originalBytes: number
  optimizedBytes: number
  durationSec: number
}

export interface OptimizeProgress {
  jobId: string
  percent: number
  stage: 'analyzing' | 'encoding' | 'done'
}

export interface UploadRequest {
  filePath: string
  collection: CollectionId
  /** Base public id (without folder); defaults to the file name. */
  publicId?: string
  resourceType: 'video' | 'image'
}

export interface UploadResult {
  publicId: string
  secureUrl: string
  /** For videos: a poster URL built from the chosen frame offset. */
  posterUrl?: string
  durationSec?: number
  width?: number
  height?: number
}

export interface PosterUrlRequest {
  publicId: string
  /** Frame offset in seconds. */
  offsetSec: number
}

/** A single new item to publish. */
export interface PublishRequest {
  collection: CollectionId
  slug: string
  data: Frontmatter
  commitMessage: string
}

/** A reorder/edit/delete batch to publish atomically. */
export interface BatchChange {
  type: 'upsert' | 'delete'
  path: string
  /** For upsert: the full frontmatter to write. */
  data?: Frontmatter
  collection: CollectionId
  slug: string
}

export interface BatchRequest {
  changes: BatchChange[]
  commitMessage: string
  /** The commit SHA the client last synced from, for stale-write detection. */
  baseSha: string
}

export interface CommitResult {
  commitSha: string
  htmlUrl: string
}

export interface SyncResult {
  /** Latest commit SHA on the target branch. */
  headSha: string
  items: ContentItem[]
  syncedAt: string
}

/** Result of any operation that can fail with a friendly message. */
export type IpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; code?: string }
