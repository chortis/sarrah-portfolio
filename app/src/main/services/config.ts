import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import type { AppConfig, PublicConfig } from '../../shared/ipc'

export const WEBSITE_TARGET = {
  githubOwner: 'chortis',
  githubRepo: 'sarrah-portfolio',
  githubBranch: 'main'
}

const EMPTY: AppConfig = {
  cloudinaryCloudName: '',
  cloudinaryApiKey: '',
  cloudinaryApiSecret: '',
  githubToken: ''
}

class ConfigService {
  private cache: AppConfig | null = null

  private get configPath(): string {
    return join(app.getPath('userData'), 'config.enc')
  }

  private readEncrypted(): Partial<AppConfig> {
    if (!existsSync(this.configPath)) return {}
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure credential storage is unavailable on this device.')
    }

    const raw = readFileSync(this.configPath)
    return JSON.parse(safeStorage.decryptString(raw)) as Partial<AppConfig>
  }

  load(): AppConfig {
    if (this.cache) return this.cache
    const merged: AppConfig = {
      ...EMPTY,
      ...this.readEncrypted()
    }
    this.cache = merged
    return merged
  }

  save(input: Partial<AppConfig>): AppConfig {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure credential storage is unavailable on this device.')
    }

    const current = this.load()
    const next: AppConfig = { ...current, ...stripUndefined(input) }
    const json = JSON.stringify(next)
    const data = safeStorage.encryptString(json)
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
      ...WEBSITE_TARGET,
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
        c.githubToken
    )
  }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')
  ) as Partial<T>
}

export const config = new ConfigService()
