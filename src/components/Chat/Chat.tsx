import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/components/common/Toast/ToastContext'
import type { Message } from '@/types'
import './Chat.scss'

const API_URL = import.meta.env.VITE_API_URL

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || streaming) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const history = messages
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, history }),
      })

      if (!response.ok) {
        throw new Error(`Chat request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Chat response body is empty')
      }

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
          disabled={streaming || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default Chat
