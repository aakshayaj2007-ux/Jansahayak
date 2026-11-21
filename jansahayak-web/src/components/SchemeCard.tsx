import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import type { SchemeRow } from '../lib/schemeMeta'
import { categoryLabel, ELIGIBILITY_META } from '../lib/schemeMeta'

export default function SchemeCard({ s, eligibility }: { s: SchemeRow; eligibility?: string }) {
  const meta = eligibility ? ELIGIBILITY_META[eligibility] : undefined
  const verified = s.verification_status === 'verified'

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-brand-100 px-2.5 py-1 font-medium text-brand-800">
          {categoryLabel(s.category)}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
          {s.government_level === 'central' ? 'Central' : `State${s.state ? ` – ${s.state}` : ''}`}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 ${
            verified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {verified ? 'Verified' : 'Not yet verified'}
        </span>
        {meta && <span className={`rounded-full px-2.5 py-1 ${meta.cls}`}>{meta.label}</span>}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-navy-900">{s.scheme_name}</h3>
      {s.department && <p className="mt-0.5 text-sm text-slate-500">{s.department}</p>}
      {s.description && <p className="mt-2 line-clamp-3 text-sm text-slate-700">{s.description}</p>}
      {s.benefits && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
          <span className="font-medium">Benefits: </span>
          {s.benefits}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        <Link
          to={`/schemes/${s.scheme_slug}`}
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          More details
        </Link>
        {s.official_url && (
          <a
            href={s.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:underline"
          >
            Official website <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  )
}