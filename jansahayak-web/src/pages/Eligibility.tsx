import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { callFunction, FN } from '../lib/functions'

type Check = { rule: string; result: 'pass' | 'fail' | 'missing'; detail: string }
type DocGuide = {
  slug: string
  document_name: string
  issued_by: string | null
  how_to_get: unknown
  typical_time: string | null
  official_url: string | null
  notes: string | null
}
type Right = { slug: string; title: string; citation: string; plain_summary: string; what_you_can_do: unknown }
type Channel = {
  slug: string
  name: string
  helpline: string | null
  website: string | null
  how_to_use: unknown
  time_limits: string | null
  cost: string | null
  escalation: string | null
}
type Detail = {
  scheme: {
    name: string
    slug: string
    department: string | null
    category: string
    government_level: string
    official_url: string | null
    application_deadline: string | null
    deadline_passed: boolean
    verification_status: string
  }
  category: string
  checks: Check[]
  conditions_to_confirm: string[]
  exclusions_to_confirm: string[]
  notes: string[]
  application_process?: string | null
  required_documents?: string[]
  documents?: DocGuide[]
  rights?: Right[]
  grievance_channels?: Channel[]
}
type Resp = { results: Detail[]; disclaimer: string }

const VERDICT: Record<string, { label: string; cls: string }> = {
  potentially_eligible: { label: 'Potentially eligible', cls: 'border-green-300 bg-green-100 text-green-800' },
  needs_official_confirmation: { label: 'Confirm with the official source', cls: 'border-sky-300 bg-sky-100 text-sky-900' },
  additional_info_required: { label: 'More information needed', cls: 'border-amber-300 bg-amber-100 text-amber-900' },
  not_eligible_known_criteria: { label: 'Not eligible based on known criteria', cls: 'border-red-300 bg-red-100 text-red-800' },
}
const RULE: Record<string, string> = {
  age: 'Age',
  income: 'Family income',
  occupation: 'Occupation',
  education: 'Education',
  state: 'State',
  district: 'District',
  gender: 'Gender',
  social_category: 'Social category',
}
const MARK: Record<Check['result'], { label: string; cls: string }> = {
  pass: { label: 'Pass', cls: 'bg-green-100 text-green-800' },
  fail: { label: 'Fail', cls: 'bg-red-100 text-red-800' },
  missing: { label: 'Add info', cls: 'bg-amber-100 text-amber-900' },
}

const safeUrl = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null)

function toList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => {
      if (typeof x === 'string') return x
      if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>
        return [o.title, o.detail].filter((p) => typeof p === 'string' && p).join(': ')
      }
      return ''
    })
    .filter(Boolean)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
    </section>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal space-y-1 pl-5">
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  )
}

export default function Eligibility() {
  const { slug } = useParams()
  const [data, setData] = useState<Detail | null>(null)
  const [disclaimer, setDisclaimer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    setError('')
    callFunction<Resp>(FN.eligibility, { scheme_slug: slug }).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else {
        setData(res.data?.results?.[0] ?? null)
        setDisclaimer(res.data?.disclaimer ?? '')
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-12 text-slate-600">Checking this scheme against your profile...</p>

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p role="alert" className="text-red-700">{error || 'Scheme not found.'}</p>
        <p className="mt-3 text-sm">
          <Link to="/profile" className="font-medium text-navy-700 underline">Open my profile</Link>{' '}
          {' | '}
          <Link to="/schemes" className="font-medium text-navy-700 underline">Back to schemes</Link>
        </p>
      </div>
    )
  }

  const v = VERDICT[data.category] ?? VERDICT.needs_official_confirmation
  const missing = data.checks.some((c) => c.result === 'missing')
  const applyUrl = safeUrl(data.scheme.official_url)
  const confirm = [...data.conditions_to_confirm, ...data.exclusions_to_confirm]
  const docs = data.documents ?? []
  const rights = data.rights ?? []
  const channels = data.grievance_channels ?? []
  const required = data.required_documents ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-10">
      <Link to="/schemes" className="text-sm font-medium text-navy-700 underline">Back to schemes</Link>

      <header>
        <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">{data.scheme.name}</h1>
        {data.scheme.department && <p className="mt-1 text-sm text-slate-600">{data.scheme.department}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${v.cls}`}>{v.label}</span>
          {data.scheme.verification_status !== 'verified' && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-900">
              Prototype data: confirm on the official website
            </span>
          )}
        </div>
      </header>

      <Section title="Your eligibility, rule by rule">
        {data.checks.length === 0 ? (
          <p>No stored rules could be checked for this scheme. Please confirm with the official source.</p>
        ) : (
          <ul className="space-y-2">
            {data.checks.map((c, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-0.5 w-16 shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-semibold ${MARK[c.result].cls}`}>
                  {MARK[c.result].label}
                </span>
                <span>
                  <span className="font-medium text-navy-900">{RULE[c.rule] ?? c.rule}: </span>
                  {c.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
        {missing && (
          <p className="mt-4">
            <Link to="/profile" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              Complete my profile
            </Link>
          </p>
        )}
      </Section>

      {(confirm.length > 0 || data.notes.length > 0) && (
        <Section title="Also confirm on the official site">
          <ul className="list-disc space-y-1 pl-5">
            {[...confirm, ...data.notes].map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Documents you may need">
        {required.length > 0 && (
          <ul className="list-disc space-y-1 pl-5">
            {required.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
        {docs.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="font-medium text-navy-900">How to get them</p>
            {docs.map((d) => (
              <details key={d.slug} className="rounded-lg border border-slate-200 p-3">
                <summary className="cursor-pointer font-medium">{d.document_name}</summary>
                <div className="mt-2 space-y-2">
                  {d.issued_by && <p>Issued by: {d.issued_by}</p>}
                  <Steps items={toList(d.how_to_get)} />
                  {d.typical_time && <p>Time: {d.typical_time}</p>}
                  {d.notes && <p className="text-slate-600">{d.notes}</p>}
                  {safeUrl(d.official_url) && (
                    <a href={safeUrl(d.official_url)!} target="_blank" rel="noopener noreferrer" className="font-medium text-navy-700 underline">
                      Official website
                    </a>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
        {required.length === 0 && docs.length === 0 && <p>No document list is stored. Check the official website.</p>}
      </Section>

      <Section title="How to apply">
        <p>{data.application_process || 'No application steps are stored. Please use the official website.'}</p>
        {data.scheme.application_deadline && (
          <p className="mt-2">
            Deadline: {data.scheme.application_deadline}
            {data.scheme.deadline_passed ? ' (this date has passed)' : ''}
          </p>
        )}
        {applyUrl ? (
          <p className="mt-4">
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-navy-700 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-900"
            >
              Apply on the official website
            </a>
          </p>
        ) : (
          <p className="mt-3 text-slate-600">No official application link is available for this scheme.</p>
        )}
      </Section>

      {rights.length > 0 && (
        <Section title="Your rights">
          <div className="space-y-2">
            {rights.map((r) => (
              <details key={r.slug} className="rounded-lg border border-slate-200 p-3">
                <summary className="cursor-pointer font-medium">{r.title}</summary>
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-slate-500">{r.citation}</p>
                  <p>{r.plain_summary}</p>
                  <Steps items={toList(r.what_you_can_do)} />
                </div>
              </details>
            ))}
          </div>
        </Section>
      )}

      {channels.length > 0 && (
        <Section title="If your application is delayed or refused">
          <div className="space-y-2">
            {channels.map((c) => (
              <details key={c.slug} className="rounded-lg border border-slate-200 p-3">
                <summary className="cursor-pointer font-medium">
                  {c.name}
                  {c.helpline ? ` (${c.helpline})` : ''}
                </summary>
                <div className="mt-2 space-y-2">
                  <Steps items={toList(c.how_to_use)} />
                  {c.time_limits && <p>Time limits: {c.time_limits}</p>}
                  {c.cost && <p>Cost: {c.cost}</p>}
                  {c.escalation && <p>If still unresolved: {c.escalation}</p>}
                  {safeUrl(c.website) && (
                    <a href={safeUrl(c.website)!} target="_blank" rel="noopener noreferrer" className="font-medium text-navy-700 underline">
                      Official website
                    </a>
                  )}
                </div>
              </details>
            ))}
          </div>
        </Section>
      )}

      <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
        {disclaimer || 'This is guidance, not an official decision. Confirm on the official website. Approval is not guaranteed.'}
      </p>
    </div>
  )
}