import { useEffect, useRef } from 'react'

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'error-callback': () => void
      'expired-callback': () => void
    },
  ) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let turnstileScript: Promise<TurnstileApi> | undefined

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (turnstileScript) return turnstileScript

  turnstileScript = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => {
      if (window.turnstile) {
        resolve(window.turnstile)
      } else {
        reject(new Error('Turnstile script loaded without its API.'))
      }
    }
    script.onerror = () => reject(new Error('Unable to load Turnstile.'))
    document.head.appendChild(script)
  })

  return turnstileScript
}

type TurnstileProps = {
  siteKey: string
  onToken: (token: string) => void
  onError: () => void
  onExpired: () => void
}

const Turnstile = ({ siteKey, onToken, onError, onExpired }: TurnstileProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let widgetId: string | undefined
    let active = true

    void loadTurnstile()
      .then(turnstile => {
        if (!active || !containerRef.current) return

        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onToken,
          'error-callback': onError,
          'expired-callback': onExpired,
        })
      })
      .catch(onError)

    return () => {
      active = false
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [onError, onExpired, onToken, siteKey])

  return <div ref={containerRef} />
}

export default Turnstile
