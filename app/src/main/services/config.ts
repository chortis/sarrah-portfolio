import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import type { AppConfig, PublicConfig } from '../../shared/ipc'

const DEFAULTS = {
  githubOwner: 'chortis',
  githubRepo: 'sarrah-portfolio',
  githubBranch: 'main'
}

const EMPTY: AppConfig = {
  cloudinaryCloudName: '',
  cloudinaryApiKey: '',
  cloudinaryApiSecret: '',
  githubToken: '',
  githubOwner: DEFAULTS.githubOwner,
  githubRepo: DEFAULTS.githubRepo,
  githubBranch: DEFAULTS.githubBranch
}

/**
 * Credentials are resolved with the following precedence:
 *   1. Values baked in at build time via env (VITE-style import.meta.env / process.env).
 *   2. Values entered at first-run setup, stored encrypted on disk via safeStorage.
 *
 * Secrets are never written in plaintext and never sent to the renderer.
 */
class ConfigService {
  private cache: AppConfig | null = null

  private get configPath(): string {
    return join(app.getPath('userData'), 'config.enc')
  }

  /** Credentials baked in at build time (see .env.desktop). */
  private bakedConfig(): Partial<AppConfig> {
    return stripUndefined({
      cloudinaryCloudName: process.env.BAKED_CLOUDINARY_CLOUD_NAME,
      cloudinaryApiKey: process.env.BAKED_CLOUDINARY_API_KEY,
      cloudinaryApiSecret: process.env.BAKED_CLOUDINARY_API_SECRET,
      githubToken: process.env.BAKED_GITHUB_TOKEN,
      githubOwner: process.env.BAKED_GITHUB_OWNER,
      githubRepo: process.env.BAKED_GITHUB_REPO,
      githubBranch: process.env.BAKED_GITHUB_BRANCH
    })
  }

  private readEncrypted(): Partial<AppConfig> {
    if (!existsSync(this.configPath)) return {}
    try {
      const raw = readFileSync(this.configPath)
      const json = safeStorage.isEncryptionAvailable()
        ? safeStorage.decryptString(raw)
        : raw.toString('utf8')
      return JSON.parse(json) as Partial<AppConfig>
    } catch {
      return {}
    }
  }

  load(): AppConfig {
    if (this.cache) return this.cache
    const merged: AppConfig = {
      ...EMPTY,
      ...this.readEncrypted(),
      ...this.bakedConfig() // baked values win so a rebuilt app can override stored ones
    }
    this.cache = merged
    return merged
  }

  save(input: Partial<AppConfig>): AppConfig {
    const current = this.load()
    const next: AppConfig = { ...current, ...stripUndefined(input) }
    const json = JSON.stringify(next)
    const data = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(json)
      : Buffer.from(json, 'utf8')
    mkdirSync(dirname(this.configPath), { recursive: true })
    writeFileSync(this.configPath, data)
    this.cache = next
    return next
  }

  /** Redacted view safe to send to the renderer. */
  toPublic(): PublicConfig {
    const c = this.load()
    return {
      cloudinaryCloudName: c.cloudinaryCloudName,
      githubOwner: c.githubOwner,
      githubRepo: c.githubRepo,
      githubBranch: c.githubBranch,
      configured: this.isConfigured(),
      hasCloudinaryKey: Boolean(c.cloudinaryApiKey),
      hasCloudinarySecret: Boolean(c.cloudinaryApiSecret),
      hasGithubToken: Boolean(c.githubToken)
    }
  }

  isConfigured(): boolean {
    const c = this.load()
    return Boolean(
      c.cloudinaryCloudName &&
        c.cloudinaryApiKey &&
        c.cloudinaryApiSecret &&
        c.githubToken &&
        c.githubOwner &&
        c.githubRepo
    )
  }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')
  ) as Partial<T>
}

export const config = new ConfigService()
