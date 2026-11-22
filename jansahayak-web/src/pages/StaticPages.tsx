import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Set this to the email address where you want to receive messages.
const CONTACT_EMAIL = 'aakshayaj2007@gmail.com'

function Shell({ titleKey, children }: { titleKey: string; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900">{t(titleKey)}</h1>
      <div className="mt-6 space-y-6 text-slate-700">{children}</div>
    </div>
  )
}

const card = 'rounded-xl border border-slate-200 bg-white p-5'

export function HowItWorks() {
  const steps = [
    ['Choose your language', 'Pick a language on the first screen. You can change it later.'],
    ['Create your profile', 'Tell us your age, location, family income and occupation. We never ask for your Aadhaar number.'],
    ['See schemes that may fit you', 'Open "Schemes for me". Each scheme is compared with your profile using the rules stored for it.'],
    ['Open the eligibility details', 'See which rules you pass, fail or still need to add, the documents you need and how to get them, and the steps to apply.'],
    ['Ask JanSahayak AI', 'Describe your problem in your own words. The assistant answers using the information stored in this platform and tells you when it does not have reliable information.'],
    ['Apply on the official website', 'We never apply for you. Use the official link on each scheme and confirm the details there.'],
  ]
  const results = [
    ['Potentially eligible', 'You meet every rule we could check.'],
    ['More information needed', 'Some details are missing from your profile.'],
    ['Confirm with the official source', 'Some conditions cannot be checked here and must be confirmed with the department.'],
    ['Not eligible based on known criteria', 'At least one stored rule does not match your profile.'],
  ]
  return (
    <Shell titleKey="nav.how">
      <ol className="space-y-3">
        {steps.map(([title, text], i) => (
          <li key={title} className={`${card} flex gap-4`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold text-navy-900">{title}</h2>
              <p className="mt-1 text-sm">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className={card}>
        <h2 className="font-semibold text-navy-900">What the results mean</h2>
        <dl className="mt-3 space-y-2 text-sm">
          {results.map(([k, v]) => (
            <div key={k}>
              <dt className="font-medium text-navy-900">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        JanSahayak AI is not an official government website. Information is guidance only. Some records are not yet
        verified, and applying never guarantees approval. Always confirm on the official portal.
      </p>
      <p>
        Ready to start? <Link to="/register" className="font-medium text-navy-700 underline">Create your profile</Link> or{' '}
        <Link to="/schemes" className="font-medium text-navy-700 underline">explore schemes</Link>.
      </p>
    </Shell>
  )
}

export function About() {
  return (
    <Shell titleKey="nav.about">
      <section className={card}>
        <h2 className="font-semibold text-navy-900">Why JanSahayak AI exists</h2>
        <p className="mt-2 text-sm">
          Many people miss government help they qualify for because the information is scattered, hard to read or
          not in their language. JanSahayak AI brings schemes, eligibility checks, documents, rights and complaint
          channels into one simple place, starting with Karnataka.
        </p>
      </section>
      <section className={card}>
        <h2 className="font-semibold text-navy-900">What it does</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Checks your profile against stored scheme rules and explains each result.</li>
          <li>Shows the documents you need and how to get them.</li>
          <li>Points you to official application links and complaint channels if you are refused or delayed.</li>
          <li>Answers questions about your problem using only the information stored in the platform.</li>
        </ul>
      </section>
      <section className={card}>
        <h2 className="font-semibold text-navy-900">What it is not</h2>
        <p className="mt-2 text-sm">
          It is not an official government service and it does not make decisions on applications. Scheme records
          show a verification status, and records marked unverified must be confirmed on the official website. Nothing
          here is legal or medical advice.
        </p>
      </section>
      <section className={card}>
        <h2 className="font-semibold text-navy-900">Your information</h2>
        <p className="mt-2 text-sm">
          We ask only for details needed to suggest schemes, and we do not ask for your Aadhaar number. Read our{' '}
          <Link to="/privacy" className="font-medium text-navy-700 underline">privacy policy</Link>.
        </p>
      </section>
      <p className="text-sm text-slate-600">This is an early prototype, so some features are still being built.</p>
    </Shell>
  )
}

export function Contact() {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (message.trim().length < 5) {
      setError('Please write a short message.')
      return
    }
    setError('')
    const body = `${message.trim()}\n\n${name.trim() ? '- ' + name.trim() : ''}`
    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject.trim() || 'JanSahayak AI feedback')}` +
      `&body=${encodeURIComponent(body)}`
  }

  const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'
  return (
    <Shell titleKey="nav.contact">
      <p className="text-sm">
        Questions, corrections to scheme information or feedback are welcome. Please do not include your Aadhaar number
        or other sensitive documents.
      </p>
      <form onSubmit={onSubmit} className={`${card} space-y-4`}>
        <label className="block text-sm font-medium">
          Your name (optional)
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </label>
        <label className="block text-sm font-medium">
          Subject
          <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} />
        </label>
        <label className="block text-sm font-medium">
          Message
          <textarea className={input} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="rounded-xl bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-900">
          Send by email
        </button>
        <p className="text-xs text-slate-500">This opens your email app with the message ready to send.</p>
      </form>
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        This website cannot handle emergencies. If someone is in danger, call 112.
      </p>
    </Shell>
  )
}