import { useEffect, useMemo, useRef, useState } from 'react'
import { COLLECTIONS, type CollectionId } from '../../../shared/collections'
import type {
  Frontmatter,
  ImageFrontmatter,
  VideoFrontmatter
} from '../../../shared/collections'
import type { OptimizeResult, UploadResult } from '../../../shared/ipc'
import { useStore } from '../lib/store'
import { unwrap } from '../lib/api'
import { formatBytes, formatOffset } from '../lib/format'
import { slugify, uniqueSlug } from '../lib/slug'
import { TimeRangeHelper } from '../components/TimeRangeHelper'

type Step = 'source' | 'processing' | 'poster' | 'details' | 'publishing'

export function AddWizard({
  collection,
  onClose
}: {
  collection: CollectionId
  onClose: () => void
}): JSX.Element {
  const def = COLLECTIONS[collection]
  const isVideo = def.media === 'video'
  const { itemsFor, sync, refresh, toast } = useStore()

  const [step, setStep] = useState<Step>('source')
  const [source, setSource] = useState<'file' | 'youtube'>('file')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const [stageLabel, setStageLabel] = useState('')
  const [optimized, setOptimized] = useState<OptimizeResult | null>(null)
  const [upload, setUpload] = useState<UploadResult | null>(null)
  const jobIdRef = useRef<string | null>(null)

  // Poster
  const [posterOffset, setPosterOffset] = useState(2)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)

  // Metadata
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [alt, setAlt] = useState('')
  const [project, setProject] = useState('')
  const [lock, setLock] = useState(false)
  const [full, setFull] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const existingSlugs = useMemo(
    () => new Set(itemsFor(collection).map((i) => i.slug)),
    [itemsFor, collection]
  )
  const nextOrder = useMemo(() => {
    const orders = itemsFor(collection).map((i) => i.data.order ?? 0)
    return (orders.length ? Math.max(...orders) : 0) + 1
  }, [itemsFor, collection])

  useEffect(() => {
    const off = window.api.onOptimizeProgress((p) => {
      if (p.jobId !== jobIdRef.current) return
      setProgress(p.percent)
      setStageLabel(p.stage === 'encoding' ? 'Optimizing video…' : 'Preparing…')
    })
    return off
  }, [])

  async function pickFile(): Promise<void> {
    const path = await window.api.pickFile(def.media)
    if (path) setFilePath(path)
  }

  // ---- Video: optimize + upload ----
  async function processVideoFile(): Promise<void> {
    if (!filePath) return
    setError(null)
    setStep('processing')
    try {
      setStageLabel('Optimizing video…')
      const opt = await unwrap(
        window.api.optimize({ inputPath: filePath, preset: 'balanced' })
      )
      setOptimized(opt)
      setProgress(100)
      setStageLabel('Uploading…')
      const up = await unwrap(
        window.api.upload({
          filePath: opt.outputPath,
          collection,
          resourceType: 'video'
        })
      )
      setUpload(up)
      await updatePoster(up.publicId, 2)
      setStep('poster')
    } catch (err) {
      setError(msg(err))
      setStep('source')
    }
  }

  // ---- Image: upload ----
  async function processImageFile(): Promise<void> {
    if (!filePath) return
    setError(null)
    setStep('processing')
    setStageLabel('Uploading image…')
    try {
      const up = await unwrap(
        window.api.upload({ filePath, collection, resourceType: 'image' })
      )
      setUpload(up)
      setStep('details')
    } catch (err) {
      setError(msg(err))
      setStep('source')
    }
  }

  async function updatePoster(publicId: string, offset: number): Promise<void> {
    const url = await unwrap(window.api.posterUrl({ publicId, offsetSec: offset }))
    setPosterUrl(url)
  }

  function startProcessing(): void {
    if (source === 'youtube') {
      // No upload/optimize needed; go straight to details.
      setStep('details')
      return
    }
    if (isVideo) void processVideoFile()
    else void processImageFile()
  }

  function buildFrontmatter(): Frontmatter {
    if (isVideo) {
      const video = source === 'youtube' ? youtubeUrl.trim() : upload!.secureUrl
      const fm: VideoFrontmatter = {
        title: title.trim(),
        description: description.trim(),
        video,
        order: nextOrder,
        lock
      }
      if (source !== 'youtube' && posterUrl) fm.poster = posterUrl
      return fm
    }
    const fm: ImageFrontmatter = {
      alt: alt.trim(),
      image: upload!.secureUrl,
      order: nextOrder,
      full
    }
    if (collection === 'private-drawings') {
      fm.project = project.trim()
      if (description.trim()) fm.description = description.trim()
    }
    return fm
  }

  async function publish(): Promise<void> {
    if (!sync) return
    setError(null)
    setStep('publishing')
    try {
      const baseName = isVideo ? title : alt
      const slug = uniqueSlug(slugify(baseName), existingSlugs)
      const data = buildFrontmatter()
      const res = await unwrap(
        window.api.publish({
          collection,
          slug,
          data,
          commitMessage: `Add ${isVideo ? title : alt} to ${def.label.toLowerCase()}`,
          baseSha: sync.headSha
        })
      )
      toast({
        kind: 'success',
        message: 'Published! Your website will update in a few minutes.',
        actionUrl: res.htmlUrl,
        actionLabel: 'View change'
      })
      await refresh()
      onClose()
    } catch (err) {
      const e = err as { code?: string }
      if (e.code === 'STALE') void refresh()
      setError(msg(err))
      setStep('details')
    }
  }

  const canSubmitSource =
    source === 'youtube' ? isValidYouTube(youtubeUrl) : Boolean(filePath)
  const canPublish = isVideo
    ? source === 'youtube'
      ? title.trim() && isValidYouTube(youtubeUrl)
      : title.trim()
    : alt.trim() && (collection !== 'private-drawings' || project.trim())

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add to {def.label}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="banner error">{error}</div>}

        {step === 'source' && (
          <div className="modal-body">
            {isVideo && def.allowsYouTube && (
              <div className="segmented">
                <button
                  className={source === 'file' ? 'active' : ''}
                  onClick={() => setSource('file')}
                >
                  Upload a video file
                </button>
                <button
                  className={source === 'youtube' ? 'active' : ''}
                  onClick={() => setSource('youtube')}
                >
                  Paste a YouTube link
                </button>
              </div>
            )}

            {source === 'file' ? (
              <div className="dropzone" onClick={pickFile}>
                {filePath ? (
                  <div className="picked">
                    <strong>{fileName(filePath)}</strong>
                    <span className="muted">Click to choose a different file</span>
                  </div>
                ) : (
                  <>
                    <div className="dz-icon">{isVideo ? '🎬' : '🖼️'}</div>
                    <p>
                      Click to choose {isVideo ? 'a .mov or .mp4 video' : 'an image'}
                    </p>
                    {isVideo && (
                      <p className="muted">We’ll optimize it for the web automatically.</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <label className="field">
                <span>YouTube link</span>
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
              </label>
            )}

            <div className="modal-actions">
              <button className="btn ghost" onClick={onClose}>Cancel</button>
              <button className="btn primary" disabled={!canSubmitSource} onClick={startProcessing}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="modal-body processing">
            <div className="spinner" />
            <p>{stageLabel}</p>
            {isVideo && source === 'file' && (
              <>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <p className="muted">{progress}%</p>
              </>
            )}
          </div>
        )}

        {step === 'poster' && upload && (
          <div className="modal-body">
            <h3>Choose the thumbnail frame</h3>
            <p className="muted">Pick the moment shown before the video plays.</p>
            {posterUrl && <img className="poster-preview" src={posterUrl} alt="" />}
            <div className="poster-controls">
              <input
                type="range"
                min={0}
                max={Math.max(10, Math.floor(upload.durationSec ?? 10))}
                step={1}
                value={posterOffset}
                onChange={(e) => setPosterOffset(Number(e.target.value))}
                onMouseUp={() => updatePoster(upload.publicId, posterOffset)}
                onKeyUp={() => updatePoster(upload.publicId, posterOffset)}
              />
              <span className="offset-label">{formatOffset(posterOffset)}</span>
            </div>
            {optimized && (
              <p className="muted small">
                Optimized: {formatBytes(optimized.originalBytes)} →{' '}
                {formatBytes(optimized.optimizedBytes)}
              </p>
            )}
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setStep('source')}>Back</button>
              <button className="btn primary" onClick={() => setStep('details')}>Continue</button>
            </div>
          </div>
        )}

        {(step === 'details' || step === 'publishing') && (
          <div className="modal-body">
            {isVideo ? (
              <>
                <label className="field">
                  <span>Title</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <label className="field">
                  <span>Description</span>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                {def.isPrivate && (
                  <TimeRangeHelper
                    onInsert={(t) =>
                      setDescription((d) => (d ? `${d} ${t}` : t))
                    }
                  />
                )}
                {def.hasLock && (
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={lock}
                      onChange={(e) => setLock(e.target.checked)}
                    />
                    <span>Password-protect this item (locked)</span>
                  </label>
                )}
              </>
            ) : (
              <>
                <label className="field">
                  <span>Description (alt text)</span>
                  <input value={alt} onChange={(e) => setAlt(e.target.value)} />
                </label>
                {collection === 'private-drawings' && (
                  <>
                    <label className="field">
                      <span>Project</span>
                      <input value={project} onChange={(e) => setProject(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Notes (optional)</span>
                      <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </label>
                  </>
                )}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={full}
                    onChange={(e) => setFull(e.target.checked)}
                  />
                  <span>Display full-width</span>
                </label>
              </>
            )}

            <div className="modal-actions">
              <button
                className="btn ghost"
                onClick={() => setStep(isVideo && source === 'file' ? 'poster' : 'source')}
                disabled={step === 'publishing'}
              >
                Back
              </button>
              <button
                className="btn primary"
                disabled={!canPublish || step === 'publishing'}
                onClick={publish}
              >
                {step === 'publishing' ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function fileName(p: string): string {
  return p.split(/[\\/]/).pop() ?? p
}

function isValidYouTube(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url.trim())
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
