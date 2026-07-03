import { useStore } from '../lib/store'

export function Toasts(): JSX.Element {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          <span className="toast-msg">{t.message}</span>
          {t.actionUrl && (
            <button
              className="toast-action"
              onClick={() => window.api.openExternal(t.actionUrl!)}
            >
              {t.actionLabel ?? 'Open'}
            </button>
          )}
          <button className="toast-close" onClick={() => dismissToast(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
