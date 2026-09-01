import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext } from './ToastContext'
import type { Toast, ToastContextValue, ToastType } from './ToastContext'

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, number>())

  const removeToast = useCallback((id: string) => {
    const currentTimer = timers.current.get(id)
    if (currentTimer) window.clearTimeout(currentTimer)

    setToasts(current =>
      current.map(toast => (toast.id === id ? { ...toast, closing: true } : toast)),
    )

    const removalTimer = window.setTimeout(() => {
      setToasts(current => current.filter(toast => toast.id !== id))
      timers.current.delete(id)
    }, 220)

    timers.current.set(id, removalTimer)
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType, duration = 4000) => {
      const id = crypto.randomUUID()

      setToasts(current => [...current, { id, message, type, closing: false }])
      timers.current.set(id, window.setTimeout(() => removeToast(id), duration))
    },
    [removeToast],
  )

  useEffect(() => {
    const activeTimers = timers.current
    return () => activeTimers.forEach(timer => window.clearTimeout(timer))
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      addToast,
      removeToast,
      success: (message, duration) => addToast(message, 'success', duration),
      error: (message, duration) => addToast(message, 'error', duration),
      warning: (message, duration) => addToast(message, 'warning', duration),
      info: (message, duration) => addToast(message, 'info', duration),
    }),
    [addToast, removeToast, toasts],
  )

  return <ToastContext value={value}>{children}</ToastContext>
}
