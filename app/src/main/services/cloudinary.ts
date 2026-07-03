import { v2 as cloudinary } from 'cloudinary'
import { COLLECTIONS, type CollectionId } from '../../shared/collections'
import type { UploadResult } from '../../shared/ipc'
import { config } from './config'

function configure(): void {
  const c = config.load()
  cloudinary.config({
    cloud_name: c.cloudinaryCloudName,
    api_key: c.cloudinaryApiKey,
    api_secret: c.cloudinaryApiSecret,
    secure: true
  })
}

/** Upload a local file to Cloudinary into the collection's folder (signed). */
export async function uploadMedia(
  filePath: string,
  collection: CollectionId,
  resourceType: 'video' | 'image',
  publicId?: string
): Promise<UploadResult> {
  configure()
  const folder = COLLECTIONS[collection].cloudinaryFolder
  const res = await cloudinary.uploader.upload(filePath, {
    resource_type: resourceType,
    folder,
    public_id: publicId,
    use_filename: !publicId,
    unique_filename: false,
    overwrite: true
  })

  return {
    publicId: res.public_id,
    secureUrl: res.secure_url,
    durationSec: (res as { duration?: number }).duration,
    width: res.width,
    height: res.height,
    posterUrl:
      resourceType === 'video' ? posterUrl(res.public_id, 2) : undefined
  }
}

/**
 * Build a poster/thumbnail URL from a video's public id and a frame offset.
 * Mirrors the existing `.../video/upload/so_<sec>/<public_id>.jpg` pattern.
 */
export function posterUrl(publicId: string, offsetSec: number): string {
  configure()
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    start_offset: String(Math.max(0, offsetSec))
  })
}

/** Verify the Cloudinary credentials by pinging the API. */
export async function ping(): Promise<{ ok: boolean; message: string }> {
  try {
    configure()
    await cloudinary.api.ping()
    return { ok: true, message: 'Connected to Cloudinary' }
  } catch (err) {
    return { ok: false, message: friendly(err) }
  }
}

function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/api_key|Invalid API|Unknown API/i.test(msg)) {
    return 'Cloudinary credentials look incorrect. Please re-check them in Settings.'
  }
  return `Could not reach Cloudinary: ${msg}`
}
