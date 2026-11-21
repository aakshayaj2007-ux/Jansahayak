import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Send, Trash2, AlertTriangle } from 'lucide-react'
import { callFunction, FN } from '../lib/functions'
import type { AssistantResponse } from '../lib/schemeMeta'
import { categoryLabel, ELIGIBILITY_META } from '../lib/schemeMeta'

type Msg = { role: 'user' | 'assistant'; text: string; data?: AssistantResponse }

const STARTERS = [
  'My crops were damaged due to heavy rainfall. What help is available?',
  'My family income is low and I cannot pay college fees.',
  'My employer has not deposited my PF.',
  'I completed my degree but cannot find a job.',
  'I need information about pension benefits.',
]

function RichText({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap break-words">
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.length > 4 && part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  )
}

export default function Ask() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const prefill = (location.state as { prefill?: string } | null)?.prefill ?? ''

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState(prefill)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send(text: string) {
    const message = text.trim()
    if (message.length < 2 || busy) return
    setError('')
    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }))
    setMessages((m) => [...m, { role: 'user', text: message }])
    setInput('')
    setBusy(true)

    const res = await callFunction<AssistantResponse>(FN.assistant, {
      message,
      language: ['en', 'kn', 'hi'].includes(i18n.language) ? i18n.language : 'en',
      history,
    })
    setBusy(false)

    if (res.error || !res.data) {
      setError(res.error ?? 'Something went wrong. Please try again.')
      return
    }
    const data = res.data
    setMessages((m) => [...m, { role: 'assistant', text: data.answer, data }])
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-8" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Ask JanSahayak AI</h1>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMessages([])
              setError('')
            }}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-red-700"
          >
            <Trash2 size={16} aria-hidden="true" /> Clear conversation
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Describe your problem in your own words. Answers come only from the information stored in JanSahayak AI and
        may be incomplete. Please do not share Aadhaar or bank details.
      </p>

      <div className="mt-5 flex-1 space-y-4">
        {messages.length === 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700">Try asking:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  className="rounded-full border border-brand-600 bg-white px-3 py-1.5 text-left text-sm text-brand-800 hover:bg-brand-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-navy-700 px-4 py-3 text-white">
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="max-w-full rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
              {m.data?.emergency_contacts && (
                <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    If you are in danger, call for help now:
                    <ul className="mt-1">
                      {m.data.emergency_contacts.map((c) => (
                        <li key={c.number}>
                          {c.name}: <strong>{c.number}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <RichText text={m.text} />

              {m.data && m.data.scheme_cards.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-navy-900">Related schemes</p>
                  {m.data.scheme_cards.map((c) => {
                    const meta = c.eligibility ? ELIGIBILITY_META[c.eligibility] : undefined
                    return (
                      <div key={c.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-800">
                            {categoryLabel(c.category)}
                          </span>
                          {meta && <span className={`rounded-full px-2 py-0.5 text-xs ${meta.cls}`}>{meta.label}</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3">
                          <Link to={`/schemes/${c.slug}`} className="text-navy-700 underline">
                            Details and eligibility
                          </Link>
                          {c.official_url && (
                            <a href={c.official_url} target="_blank" rel="noopener noreferrer" className="text-navy-700 underline">
                              Official website
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {m.data && m.data.sources.length > 0 && (
                <details className="mt-3 text-sm text-slate-600">
                  <summary className="cursor-pointer">Sources</summary>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {m.data.sources.map((x, j) => (
                      <li key={j}>
                        {x.url ? (
                          <a href={x.url} target="_blank" rel="noopener noreferrer" className="text-navy-700 underline">
                            {x.name}
                          </a>
                        ) : (
                          x.name
                        )}
                        {x.citation ? ` (${x.citation})` : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {m.data && m.data.suggested_questions.length > 0 && i === messages.length - 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.data.suggested_questions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      className="rounded-full border border-slate-300 px-3 py-1 text-left text-xs text-slate-700 hover:bg-slate-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {m.data && <p className="mt-3 text-xs text-slate-500">{m.data.disclaimer}</p>}
            </div>
          ),
        )}

        {busy && <p className="text-sm text-slate-600">JanSahayak AI is thinking…</p>}
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-0 mt-4 flex gap-2 bg-surface py-3">
        <label htmlFor="ask-input" className="sr-only">
          Your question
        </label>
        <textarea
          id="ask-input"
          rows={2}
          maxLength={1000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
          placeholder="Type your question here"
          className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy || input.trim().length < 2}
          aria-label="Send"
          className="self-end rounded-xl bg-brand-700 p-3 text-white hover:bg-brand-800 disabled:opacity-50"
        >
          <Send size={20} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}