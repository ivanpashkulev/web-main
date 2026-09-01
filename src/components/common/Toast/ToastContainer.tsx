import { useToast } from './ToastContext'
import type { ToastType } from './ToastContext'
import './ToastContainer.scss'

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '×',
  warning: '!',
  info: 'i',
}

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="false">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}${toast.closing ? ' toast--closing' : ''}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <span className="toast__icon" aria-hidden="true">
            {icons[toast.type]}
          </span>
          <span className="toast__message">{toast.message}</span>
          <button
            className="toast__close"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => removeToast(toast.id)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ))}
    </div>
  )
}
