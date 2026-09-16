import { useState, useRef, useEffect, useCallback } from 'react'
import { useToast } from '@/components/common/Toast/ToastContext'
import type { Message } from '@/types'
import './Chat.scss'
import Turnstile from './Turnstile'

const API_URL = import.meta.env.VITE_API_URL
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const HISTORY_LIMIT_MESSAGE =
  'This conversation has reached its maximum length. For further questions, contact Ivan at ivan@ivanpashkulev.com.'
const MESSAGE_LIMIT_MESSAGE =
  'Your message is too long. Please shorten it and try again.'
const VERIFICATION_UNAVAILABLE_MESSAGE =
  'Verification is unavailable. Reload this page to try again.'

type ErrorResponse = {
  detail?: {
    code?: string
  }
}

type VerificationState =
  | { status: 'checking-session' }
  | { status: 'challenge-required' }
  | { status: 'token-ready'; token: string }
  | { status: 'verified-session' }
  | { status: 'unavailable' }

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [verification, setVerification] = useState<VerificationState>({
    status: 'checking-session',
  })
  const bottomRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  const replacePendingAssistantMessage = (content: string) => {
    setMessages(current => [
      ...current.slice(0, -1),
      { role: 'assistant', content },
    ])
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let active = true

    void fetch(`${API_URL}/chat/session`, { credentials: 'include' })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to verify the chat session.')
        return response.json() as Promise<{ verified: boolean }>
      })
      .then(({ verified }) => {
        if (!active) return

        setVerification({
          status: verified ? 'verified-session' : 'challenge-required',
        })
      })
      .catch(error => {
        console.error('Failed to check chat session:', error)
        if (active) setVerification({ status: 'unavailable' })
      })

    return () => {
      active = false
    }
  }, [])

  const handleTurnstileToken = useCallback((token: string) => {
    setVerification({ status: 'token-ready', token })
  }, [])

  const handleTurnstileError = useCallback(() => {
    setVerification({ status: 'unavailable' })
  }, [])

  const handleTurnstileExpired = useCallback(() => {
    setVerification({ status: 'challenge-required' })
  }, [])

  const turnstileToken = verification.status === 'token-ready'
    ? verification.token
    : undefined
  const verificationComplete = verification.status === 'verified-session'
    || verification.status === 'token-ready'
  const showTurnstile = verification.status === 'challenge-required'
    || verification.status === 'token-ready'
  const turnstileClassName = verification.status === 'token-ready'
    ? 'chat__verification chat__verification--token-ready'
    : 'chat__verification'

  const sendMessage = async () => {
    if (
      !input.trim()
      || streaming
      || !verificationComplete
    ) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const history = messages
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage.content,
          history,
          turnstile_token: turnstileToken,
        }),
      })

      if (response.status === 403) {
        replacePendingAssistantMessage(
          VERIFICATION_UNAVAILABLE_MESSAGE,
        )
        setVerification({ status: 'unavailable' })
        return
      }

      if (response.status === 429) {
        replacePendingAssistantMessage(
          'You have reached the chat request limit. Please contact Ivan at ivan@ivanpashkulev.com if you would like to continue the conversation.',
        )
        return
      }

      if (response.status === 413) {
        const error = await response.json().catch(() => null) as ErrorResponse | null

        if (error?.detail?.code === 'conversation_history_limit_exceeded') {
          replacePendingAssistantMessage(HISTORY_LIMIT_MESSAGE)
          return
        }

        if (error?.detail?.code === 'chat_message_limit_exceeded') {
          replacePendingAssistantMessage(MESSAGE_LIMIT_MESSAGE)
          return
        }

        return
      }

      if (!response.ok) {
        if (response.status === 503) {
          replacePendingAssistantMessage(VERIFICATION_UNAVAILABLE_MESSAGE)
          setVerification({ status: 'unavailable' })
          return
        }

        throw new Error(`Chat request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Chat response body is empty')
      }

      setVerification({ status: 'verified-session' })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          if (!event.startsWith('data: ')) continue
          const chunk = event.slice(6)
          if (chunk === '[DONE]') continue

          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
            return updated
          })
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Unable to send your message. Please try again.')
      setMessages(current => {
        const lastMessage = current.at(-1)
        return lastMessage?.role === 'assistant' && !lastMessage.content
          ? current.slice(0, -1)
          : current
      })
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="chat">
      <div
        className="chat__messages"
        aria-live="polite"
        aria-busy={streaming}
      >
        {messages.map((msg, i) => (
          // Messages are append-only, so their indexes remain stable.
          // eslint-disable-next-line react-x/no-array-index-key
          <div key={i} className={`chat__message chat__message--${msg.role}`}>
            <p className={streaming && i === messages.length - 1 ? 'chat__message__streaming' : ''}>
              {msg.content}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat__input-area">
        {showTurnstile && (
          <div className={turnstileClassName}>
            <Turnstile
              siteKey={TURNSTILE_SITE_KEY}
              onToken={handleTurnstileToken}
              onError={handleTurnstileError}
              onExpired={handleTurnstileExpired}
            />
          </div>
        )}
        {verification.status === 'unavailable' && (
          <p className="chat__verification-error" role="alert">
            {VERIFICATION_UNAVAILABLE_MESSAGE}
          </p>
        )}
        <textarea
          className="chat__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={streaming}
          rows={1}
        />
        <button
          className="chat__send"
          onClick={() => void sendMessage()}
          disabled={
            streaming
            || !input.trim()
            || !verificationComplete
          }
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default Chat
