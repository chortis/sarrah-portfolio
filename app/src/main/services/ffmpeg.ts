import ffmpeg from 'fluent-ffmpeg'
import ffmpegStaticImport from 'ffmpeg-static'
import { app } from 'electron'
import { statSync, mkdirSync } from 'fs'
import { basename, extname, join } from 'path'
import { tmpdir } from 'os'
import type {
  FfmpegPreset,
  OptimizeProgress,
  OptimizeResult
} from '../../shared/ipc'

// ffmpeg-static exports the binary path as default. When packaged inside an
// asar archive, the binary is unpacked; rewrite the path accordingly.
function resolveFfmpegPath(): string {
  const raw = (ffmpegStaticImport as unknown as string) || ''
  return raw.replace('app.asar', 'app.asar.unpacked')
}

const ffmpegPath = resolveFfmpegPath()
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath)

interface PresetOpts {
  crf: number
  preset: string
  maxHeight: number
  audioBitrate: string
}

const PRESETS: Record<FfmpegPreset, PresetOpts> = {
  balanced: { crf: 23, preset: 'medium', maxHeight: 1080, audioBitrate: '128k' },
  smaller: { crf: 28, preset: 'slow', maxHeight: 720, audioBitrate: '96k' },
  quality: { crf: 20, preset: 'slow', maxHeight: 1440, audioBitrate: '192k' }
}

export interface OptimizeHandle {
  jobId: string
  promise: Promise<OptimizeResult>
  cancel: () => void
}

/**
 * Optimize a video for the web: H.264 MP4, yuv420p, +faststart, capped height,
 * AAC audio. Emits progress via the supplied callback.
 */
export function optimizeVideo(
  jobId: string,
  inputPath: string,
  preset: FfmpegPreset,
  onProgress: (p: OptimizeProgress) => void
): OptimizeHandle {
  const opts = PRESETS[preset]
  const outDir = join(app.getPath('temp') || tmpdir(), 'sarrah-manager')
  const name = basename(inputPath, extname(inputPath))
  const outputPath = join(outDir, `${name}-optimized.mp4`)

  let command: ffmpeg.FfmpegCommand
  let cancelled = false

  const promise = new Promise<OptimizeResult>((resolve, reject) => {
    mkdirSync(outDir, { recursive: true })
    onProgress({ jobId, percent: 0, stage: 'analyzing' })

    command = ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate(opts.audioBitrate)
      .outputOptions([
        `-crf ${opts.crf}`,
        `-preset ${opts.preset}`,
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        // Downscale only if taller than maxHeight; keep aspect, force even dims.
        `-vf scale='trunc(oh*a/2)*2':'min(${opts.maxHeight},ih)'`
      ])
      .on('progress', (p) => {
        const percent = Math.max(0, Math.min(99, Math.round(p.percent ?? 0)))
        onProgress({ jobId, percent, stage: 'encoding' })
      })
      .on('end', () => {
        onProgress({ jobId, percent: 100, stage: 'done' })
        const originalBytes = safeSize(inputPath)
        const optimizedBytes = safeSize(outputPath)
        resolve({ outputPath, originalBytes, optimizedBytes, durationSec: 0 })
      })
      .on('error', (err) => {
        if (cancelled) {
          reject(new Error('cancelled'))
        } else {
          reject(new Error(`Video optimization failed: ${err.message}`))
        }
      })
      .save(outputPath)
  })

  return {
    jobId,
    promise,
    cancel: () => {
      cancelled = true
      try {
        command?.kill('SIGKILL')
      } catch {
        /* ignore */
      }
    }
  }
}

function safeSize(path: string): number {
  try {
    return statSync(path).size
  } catch {
    return 0
  }
}
