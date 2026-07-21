import { useState } from 'react'
import { useStore } from '../lib/store'
import { unwrap } from '../lib/api'
import type { AppConfig, ConnectionCheck } from '../../../shared/ipc'

export function SettingsView({ firstRun = false }: { firstRun?: boolean }): JSX.Element {
  const { config, reloadConfig, refresh, toast } = useStore()
  const [form, setForm] = useState<Partial<AppConfig>>({
    cloudinaryCloudName: config?.cloudinaryCloudName ?? ''
  })
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [check, setCheck] = useState<ConnectionCheck | null>(null)

  const set = (k: keyof AppConfig, v: string): void =>
    setForm((f) => ({ ...f, [k]: v }))

  async function save(): Promise<void> {
    setSaving(true)
    try {
      // Only send secret fields if the user typed something.
      const payload: Partial<AppConfig> = { ...form }
      for (const key of [
        'cloudinaryApiKey',
        'cloudinaryApiSecret',
        'githubToken'
      ] as const) {
        if (!payload[key]) delete payload[key]
      }
      await unwrap(window.api.saveConfig(payload))
      await reloadConfig()
      toast({ kind: 'success', message: 'Settings saved.' })
      if (firstRun) await refresh()
    } catch (err) {
      toast({ kind: 'error', message: `Could not save: ${msg(err)}` })
    } finally {
      setSaving(false)
    }
  }

  async function testConnections(): Promise<void> {
    setChecking(true)
    setCheck(null)
    try {
      // Save first so the test uses the latest values.
      await save()
      const result = await unwrap(window.api.checkConnections())
      setCheck(result)
    } catch (err) {
      toast({ kind: 'error', message: msg(err) })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="settings">
      {firstRun && (
        <div className="welcome">
          <h1>Welcome 👋</h1>
          <p>
            Let’s connect the app so it can publish to Sarrah’s website. You only
            need to do this once. If someone set this up for you, you can skip
            straight in.
          </p>
        </div>
      )}
      {!firstRun && <h1>Settings</h1>}

      <section className="card">
        <h2>Cloudinary (where videos & images are stored)</h2>
        <label className="field">
          <span>Cloud name</span>
          <input
            value={form.cloudinaryCloudName ?? ''}
            onChange={(e) => set('cloudinaryCloudName', e.target.value)}
            placeholder="e.g. dbozy2cc7"
          />
        </label>
        <label className="field">
          <span>API key</span>
          <input
            type="password"
            placeholder={config?.hasCloudinaryKey ? '•••••• (saved)' : 'Paste API key'}
            onChange={(e) => set('cloudinaryApiKey', e.target.value)}
          />
        </label>
        <label className="field">
          <span>API secret</span>
          <input
            type="password"
            placeholder={
              config?.hasCloudinarySecret ? '•••••• (saved)' : 'Paste API secret'
            }
            onChange={(e) => set('cloudinaryApiSecret', e.target.value)}
          />
        </label>
      </section>

      <section className="card">
        <h2>GitHub (where the website lives)</h2>
        <label className="field">
          <span>Access token</span>
          <input
            type="password"
            placeholder={config?.hasGithubToken ? '•••••• (saved)' : 'Paste token'}
            onChange={(e) => set('githubToken', e.target.value)}
          />
        </label>
        <p>
          This app only publishes to {config?.githubOwner}/{config?.githubRepo} on{' '}
          {config?.githubBranch}.
        </p>
      </section>

      {check && (
        <div className="conn-results">
          <ConnRow label="Cloudinary" ok={check.cloudinary.ok} msg={check.cloudinary.message} />
          <ConnRow label="GitHub" ok={check.github.ok} msg={check.github.message} />
        </div>
      )}

      <div className="actions">
        <button className="btn" onClick={testConnections} disabled={checking || saving}>
          {checking ? 'Testing…' : 'Save & test connection'}
        </button>
        {!firstRun && (
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>
    </div>
  )
}

function ConnRow({ label, ok, msg }: { label: string; ok: boolean; msg: string }): JSX.Element {
  return (
    <div className={`conn-row ${ok ? 'ok' : 'bad'}`}>
      <span className="conn-badge">{ok ? '✓' : '✕'}</span>
      <strong>{label}:</strong> <span>{msg}</span>
    </div>
  )
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
