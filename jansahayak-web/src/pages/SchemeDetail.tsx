import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { callFunction, FN } from '../lib/functions'
import { useAuth } from '../auth/AuthContext'
import type { EligibilityItem, EligibilityResponse, SchemeFull } from '../lib/schemeMeta'
import { categoryLabel, ELIGIBILITY_META, toList } from '../lib/schemeMeta'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      <div className="mt-2 text-slate-700">{children}</div>
    </section>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal space-y-1 pl-5">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ol>
  )
}

function EligibilityPanel({ item, disclaimer }: { item: EligibilityItem; disclaimer: string }) {
  const meta = ELIGIBILITY_META[item.category]
  const symbol = { pass: '✓', fail: '✗', missing: '?' } as const
  const color = { pass: 'text-green-700', fail: 'text-red-700', missing: 'text-amber-700' } as const

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-navy-900">Your eligibility check</h2>
      {meta && <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm ${meta.cls}`}>{meta.label}</span>}

      {item.checks.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {item.checks.map((c, i) => (
            <li key={i}>
              <span className={`font-bold ${color[c.result]}`}>{symbol[c.result]}</span>{' '}
              <span className="font-medium capitalize">{c.rule.replace('_', ' ')}:</span> {c.detail}
            </li>
          ))}
        </ul>
      )}
      {item.checks.some((c) => c.result === 'missing') && (
        <p className="mt-3 text-sm">
          Some details are missing.{' '}
          <Link to="/profile" className="font-medium text-navy-700 underline">
            Complete your profile
          </Link>
          .
        </p>
      )}

      {(item.conditions_to_confirm.length > 0 || item.exclusions_to_confirm.length > 0) && (
        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">Please confirm these on the official website:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {[...item.conditions_to_confirm, ...item.exclusions_to_confirm].map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {item.notes.length > 0 && <p className="mt-3 text-sm text-slate-600">{item.notes.join(' ')}</p>}

      {item.documents && item.documents.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-navy-900">How to get the documents you may need</h3>
          <div className="mt-2 space-y-3">
            {item.documents.map((d) => (
              <details key={d.slug} className="rounded-xl border border-slate-200 p-3">
                <summary className="cursor-pointer font-medium">{d.document_name}</summary>
                {d.issued_by && <p className="mt-2 text-sm text-slate-600">Issued by: {d.issued_by}</p>}
                <div className="mt-2 text-sm">
                  <Steps items={toList(d.how_to_get)} />
                </div>
                {d.notes && <p className="mt-2 text-sm text-slate-600">{d.notes}</p>}
                {d.official_url && (
                  <a href={d.official_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-navy-700 underline">
                    Official page
                  </a>
                )}
              </details>
            ))}
          </div>
        </div>
      )}

      {item.rights && item.rights.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-navy-900">Your rights</h3>
          <div className="mt-2 space-y-3">
            {item.rights.map((r) => (
              <details key={r.slug} className="rounded-xl border border-slate-200 p-3">
                <summary className="cursor-pointer font-medium">{r.title}</summary>
                <p className="mt-2 text-xs text-slate-500">{r.citation}</p>
                <p className="mt-2 text-sm">{r.plain_summary}</p>
                <div className="mt-2 text-sm">
                  <Steps items={toList(r.what_you_can_do)} />
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {item.grievance_channels && item.grievance_channels.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-navy-900">If your application is refused or delayed</h3>
          <div className="mt-2 space-y-3">
            {item.grievance_channels.map((c) => (
              <details key={c.slug} className="rounded-xl border border-slate-200 p-3">
                <summary className="cursor-pointer font-medium">
                  {c.name}
                  {c.helpline ? ` – ${c.helpline}` : ''}
                </summary>
                <div className="mt-2 text-sm">
                  <Steps items={toList(c.how_to_use)} />
                </div>
                {c.time_limits && <p className="mt-2 text-sm text-slate-600">Time limits: {c.time_limits}</p>}
                {c.cost && <p className="text-sm text-slate-600">Cost: {c.cost}</p>}
                {c.escalation && <p className="text-sm text-slate-600">Next level: {c.escalation}</p>}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-navy-700 underline">
                    Official website
                  </a>
                )}
              </details>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">{disclaimer}</p>
    </div>
  )
}

export default function SchemeDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()

  const [s, setS] = useState<SchemeFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState('')
  const [result, setResult] = useState<{ item: EligibilityItem; disclaimer: string } | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    setError('')
    supabase
      .from('schemes')
      .select('*, scheme_sources(*)')
      .eq('scheme_slug', slug)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setS(data as SchemeFull | null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!s || !session) return
    supabase
      .from('saved_schemes')
      .select('id')
      .eq('scheme_id', s.id)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data))
  }, [s, session])

  async function toggleSave() {
    if (!s) return
    if (!session) {
      navigate('/login', { state: { from: `/schemes/${s.scheme_slug}` } })
      return
    }
    setSaveBusy(true)
    const res = saved
      ? await supabase.from('saved_schemes').delete().eq('scheme_id', s.id)
      : await supabase.from('saved_schemes').insert({ user_id: session.user.id, scheme_id: s.id })
    setSaveBusy(false)
    if (res.error) setError(res.error.message)
    else setSaved(!saved)
  }

  async function checkEligibility() {
    if (!s) return
    if (!session) {
      navigate('/login', { state: { from: `/schemes/${s.scheme_slug}` } })
      return
    }
    setChecking(true)
    setCheckError('')
    setResult(null)
    const res = await callFunction<EligibilityResponse>(FN.eligibility, { scheme_slug: s.scheme_slug })
    setChecking(false)
    if (res.error) setCheckError(res.error)
    else if (res.data?.results[0]) setResult({ item: res.data.results[0], disclaimer: res.data.disclaimer })
  }

  if (loading) return <p className="px-4 py-20 text-center text-slate-600">Loading…</p>
  if (error) return <p role="alert" className="px-4 py-20 text-center text-red-700">{error}</p>
  if (!s) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-slate-700">Scheme not found.</p>
        <Link to="/schemes" className="mt-3 inline-block text-navy-700 underline">
          Back to schemes
        </Link>
      </div>
    )
  }

  const verified = s.verification_status === 'verified'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/schemes" className="text-sm text-navy-700 hover:underline">
        ← All schemes
      </Link>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-brand-100 px-2.5 py-1 font-medium text-brand-800">{categoryLabel(s.category)}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {s.government_level === 'central' ? 'Central' : `State${s.state ? ` – ${s.state}` : ''}`}
        </span>
        <span className={`rounded-full px-2.5 py-1 ${verified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {verified ? 'Verified' : 'Not yet verified – confirm on the official website'}
        </span>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-navy-900 sm:text-3xl">{s.scheme_name}</h1>
      {s.department && <p className="mt-1 text-slate-600">{s.department}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={toggleSave}
          disabled={saveBusy}
          className="rounded-xl border border-navy-700 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {saved ? 'Saved ✓ (click to remove)' : 'Save scheme'}
        </button>
        {s.official_url ? (
          <a
            href={s.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Apply on official website <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : (
          <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
            No official application portal is stored for this scheme.
          </span>
        )}
        <button
          type="button"
          onClick={checkEligibility}
          disabled={checking}
          className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-900 disabled:opacity-60"
        >
          {checking ? 'Checking…' : 'Check my eligibility'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/ask', { state: { prefill: `Tell me about ${s.scheme_name} and how I can apply.` } })}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ask AI about this scheme
        </button>
      </div>

      {checkError && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {checkError}{' '}
          {checkError.toLowerCase().includes('profile') && (
            <Link to="/profile" className="font-medium underline">
              Open my profile
            </Link>
          )}
        </p>
      )}
      {result && <EligibilityPanel item={result.item} disclaimer={result.disclaimer} />}

      {s.description && <Section title="About this scheme">{s.description}</Section>}
      {s.purpose && <Section title="Purpose">{s.purpose}</Section>}
      {s.benefits && <Section title="Benefits">{s.benefits}</Section>}
      {s.target_groups && s.target_groups.length > 0 && (
        <Section title="Who it is for">{s.target_groups.join(', ')}</Section>
      )}
      {s.required_documents && s.required_documents.length > 0 && (
        <Section title="Documents that may be required">
          <ul className="list-disc space-y-1 pl-5">
            {s.required_documents.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </Section>
      )}
      {s.application_process && <Section title="How to apply">{s.application_process}</Section>}
      <Section title="Deadline">
        {s.application_deadline ? s.application_deadline : 'No deadline is stored. Check the official website for current dates.'}
      </Section>

      {s.scheme_sources && s.scheme_sources.length > 0 && (
        <Section title="Sources">
          <ul className="space-y-1">
            {s.scheme_sources.map((x) => (
              <li key={x.id}>
                <a href={x.source_url} target="_blank" rel="noopener noreferrer" className="text-navy-700 underline">
                  {x.source_name}
                </a>{' '}
                <span className="text-xs text-slate-500">({x.verification_status})</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <p className="mt-6 text-xs text-slate-500">
        Last verified: {s.last_verified_at ? s.last_verified_at.slice(0, 10) : 'not verified yet'}. JanSahayak AI is
        not an official government website.
      </p>
    </div>
  )
}