import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { callFunction, FN } from '../lib/functions'
import { useAuth } from '../auth/AuthContext'
import type { EligibilityItem, EligibilityResponse, SchemeRow } from '../lib/schemeMeta'
import { CATEGORIES } from '../lib/schemeMeta'
import SchemeCard from '../components/SchemeCard'

const PAGE_SIZE = 9
const COLS =
  'id, scheme_name, scheme_slug, department, description, benefits, category, government_level, state, official_url, verification_status'

const selectCls = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'

export default function Schemes() {
  const { session } = useAuth()
  const [tab, setTab] = useState<'all' | 'me'>('all')

  // "All schemes" tab
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<SchemeRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // "For me" tab
  const [mine, setMine] = useState<EligibilityItem[]>([])
  const [mineLoading, setMineLoading] = useState(false)
  const [mineError, setMineError] = useState('')

  useEffect(() => {
    if (tab !== 'all') return
    let cancelled = false
    setLoading(true)
    setError('')

    let q = supabase.from('schemes').select(COLS, { count: 'exact' })
    if (category) q = q.eq('category', category)
    if (level) q = q.eq('government_level', level)
    const term = applied.replace(/[,()%*\\]/g, ' ').trim()
    if (term) {
      q = q.or(`scheme_name.ilike.%${term}%,description.ilike.%${term}%,department.ilike.%${term}%`)
    }
    q = q.order('scheme_name').range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    q.then(({ data, error: err, count }) => {
      if (cancelled) return
      if (err) setError(err.message)
      else {
        setRows((data ?? []) as SchemeRow[])
        setTotal(count ?? 0)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [tab, category, level, applied, page])

  useEffect(() => {
    if (tab !== 'me' || !session) return
    let cancelled = false
    setMineLoading(true)
    setMineError('')
    callFunction<EligibilityResponse>(FN.eligibility, { limit: 100 }).then((res) => {
      if (cancelled) return
      if (res.error) setMineError(res.error)
      else setMine(res.data?.results ?? [])
      setMineLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [tab, session])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    setPage(0)
    setApplied(search)
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">Government Schemes</h1>
      <p className="mt-1 text-sm text-slate-600">
        Details may change. Always confirm on the official website before applying.
      </p>

      <div className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`rounded-lg px-4 py-2 font-medium ${tab === 'all' ? 'bg-brand-700 text-white' : 'text-slate-700'}`}
        >
          All schemes
        </button>
        <button
          type="button"
          onClick={() => setTab('me')}
          className={`rounded-lg px-4 py-2 font-medium ${tab === 'me' ? 'bg-brand-700 text-white' : 'text-slate-700'}`}
        >
          Schemes for me
        </button>
      </div>

      {tab === 'all' && (
        <>
          <form onSubmit={onSearch} className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search schemes"
                aria-label="Search schemes"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(0)
              }}
              className={selectCls}
            >
              <option value="">All categories</option>
              {CATEGORIES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select
              aria-label="Central or state"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value)
                setPage(0)
              }}
              className={selectCls}
            >
              <option value="">Central and state</option>
              <option value="central">Central</option>
              <option value="state">State</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-900"
            >
              Search
            </button>
          </form>

          {loading && <p className="mt-8 text-slate-600">Loading…</p>}
          {error && (
            <p role="alert" className="mt-8 text-red-700">
              Could not load schemes: {error}
            </p>
          )}
          {!loading && !error && rows.length === 0 && (
            <p className="mt-8 text-slate-600">No schemes match your search.</p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((s) => (
              <SchemeCard key={s.id} s={s} />
            ))}
          </div>

          {total > PAGE_SIZE && (
            <div className="mt-8 flex items-center justify-center gap-4 text-sm">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {pages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'me' && (
        <div className="mt-6">
          {!session && (
            <p className="text-slate-700">
              Please{' '}
              <Link to="/login" state={{ from: '/schemes' }} className="font-medium text-navy-700 underline">
                log in
              </Link>{' '}
              and complete your profile to see schemes that may fit you.
            </p>
          )}
          {session && mineLoading && <p className="text-slate-600">Checking schemes against your profile…</p>}
          {session && mineError && (
            <p role="alert" className="text-red-700">
              {mineError}{' '}
              <Link to="/profile" className="font-medium underline">
                Open my profile
              </Link>
            </p>
          )}
          {session && !mineLoading && !mineError && mine.length === 0 && (
            <p className="text-slate-600">No schemes to show yet.</p>
          )}
          <p className="mb-4 text-sm text-slate-600">
            These results use the rules stored for each scheme and your profile. They are not an official decision.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {mine.map((m) => (
              <div key={m.scheme.id} className="flex flex-col gap-2">
                <SchemeCard
                  eligibility={m.category}
                  s={{
                    id: m.scheme.id,
                    scheme_name: m.scheme.name,
                    scheme_slug: m.scheme.slug,
                    department: m.scheme.department,
                    description: null,
                    benefits: m.scheme.benefits,
                    category: m.scheme.category,
                    government_level: m.scheme.government_level,
                    state: m.scheme.state,
                    official_url: m.scheme.official_url,
                    verification_status: m.scheme.verification_status,
                  }}
                />
                <Link
                  to={`/schemes/${m.scheme.slug}/eligibility`}
                  className="text-sm font-medium text-navy-700 underline"
                >
                  See eligibility details and next steps
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}