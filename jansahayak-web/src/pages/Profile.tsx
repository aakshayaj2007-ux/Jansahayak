import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { setLanguage } from '../i18n'

type Form = Record<string, string>

const OCCUPATIONS = [
  ['farmer', 'Farmer'],
  ['student', 'College student'],
  ['postgraduate_student', 'Postgraduate student'],
  ['private_employee', 'Private employee'],
  ['government_employee', 'Government employee'],
  ['unemployed_graduate', 'Unemployed graduate'],
]
const EDUCATION = [
  ['10th', '10th'],
  ['12th', '12th'],
  ['diploma', 'Diploma'],
  ['undergraduate', 'Undergraduate'],
  ['postgraduate', 'Postgraduate'],
  ['other', 'Other'],
]
const GENDERS = [
  ['female', 'Female'],
  ['male', 'Male'],
  ['other', 'Other'],
]
const CATEGORIES = [
  ['general', 'General'],
  ['obc', 'OBC'],
  ['sc', 'SC'],
  ['st', 'ST'],
]
const LANGS = [
  ['en', 'English'],
  ['kn', 'ಕನ್ನಡ'],
  ['hi', 'हिन्दी'],
]

const EXTRA_KEYS: Record<string, string[]> = {
  farmer: ['land_category', 'crops', 'irrigation'],
  student: ['course', 'institution_type', 'study_year'],
  postgraduate_student: ['course', 'institution_type', 'study_year'],
  private_employee: ['employment_sector'],
  government_employee: ['employment_sector'],
  unemployed_graduate: ['degree', 'graduation_year'],
}

function ageFrom(dob: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const n = new Date()
  let a = n.getFullYear() - d.getFullYear()
  const m = n.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--
  return a
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  )
}

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2'

export default function Profile() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const userId = session?.user.id

  const [f, setF] = useState<Form>({ state: 'Karnataka', preferred_language: 'en' })
  const [extra, setExtra] = useState<Form>({})
  const [alreadyConsented, setAlreadyConsented] = useState(false)
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        if (data) {
          const next: Form = {}
          for (const [k, v] of Object.entries(data)) {
            if (v !== null && typeof v !== 'object') next[k] = String(v)
          }
          setF((prev) => ({ ...prev, ...next }))
          if (data.extra_details && typeof data.extra_details === 'object') {
            setExtra(data.extra_details as Form)
          }
          setAlreadyConsented(data.consent_given === true)
        }
        setLoading(false)
      })
  }, [userId])

  const set = (k: string) => (e: { target: { value: string } }) =>
    setF((p) => ({ ...p, [k]: e.target.value }))
  const setX = (k: string) => (e: { target: { value: string } }) =>
    setExtra((p) => ({ ...p, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    if (!userId) return

    if (!f.full_name?.trim()) return setError(t('profile.needName', 'Please enter your full name.'))
    const age = ageFrom(f.date_of_birth ?? '')
    if (age === null || age < 5 || age > 110) {
      return setError(t('profile.badDob', 'Please enter a valid date of birth.'))
    }
    if (f.mobile && !/^[6-9]\d{9}$/.test(f.mobile)) {
      return setError(t('profile.badMobile', 'Mobile number must be 10 digits.'))
    }
    const income = f.annual_family_income === undefined || f.annual_family_income === ''
      ? null
      : Number(f.annual_family_income)
    if (income !== null && (isNaN(income) || income < 0)) {
      return setError(t('profile.badIncome', 'Income must be a number, 0 or more.'))
    }
    if (!alreadyConsented && !consent) {
      return setError(t('auth.needConsent', 'Please accept the consent to continue.'))
    }

    const keys = EXTRA_KEYS[f.occupation] ?? []
    const extraOut: Form = {}
    for (const k of keys) if (extra[k]?.trim()) extraOut[k] = extra[k].trim()

    const required = [
      f.full_name, f.date_of_birth, f.gender, f.state, f.district,
      f.location_type, f.occupation, f.education_level,
    ]
    const complete = required.every((v) => v && String(v).trim() !== '') && income !== null

    const payload: Record<string, unknown> = {
      full_name: f.full_name.trim(),
      date_of_birth: f.date_of_birth,
      age,
      gender: f.gender || null,
      social_category: f.social_category || null,
      mobile: f.mobile || null,
      state: f.state?.trim() || null,
      district: f.district?.trim() || null,
      taluk: f.taluk?.trim() || null,
      village_or_city: f.village_or_city?.trim() || null,
      location_type: f.location_type || null,
      annual_family_income: income,
      occupation: f.occupation || null,
      education_level: f.education_level || null,
      preferred_language: f.preferred_language || 'en',
      extra_details: extraOut,
      profile_completed: complete,
    }
    if (!alreadyConsented) {
      payload.consent_given = true
      payload.consent_at = new Date().toISOString()
    }

    setBusy(true)
    const { error: err } = await supabase.from('profiles').update(payload).eq('id', userId)
    setBusy(false)
    if (err) return setError(err.message)

    setAlreadyConsented(true)
    setSaved(true)
    setLanguage(f.preferred_language || 'en')
  }

  if (loading) return <p className="px-4 py-20 text-center text-slate-600">Loading…</p>

  const extraKeys = EXTRA_KEYS[f.occupation] ?? []
  const extraLabels: Record<string, string> = {
    land_category: 'Landholding category (for example small, marginal, large)',
    crops: 'Crops grown',
    irrigation: 'Irrigation type (for example rainfed, borewell, canal)',
    course: 'Course',
    institution_type: 'Institution type (government, aided, private)',
    study_year: 'Year of study',
    employment_sector: 'Employment sector',
    degree: 'Degree',
    graduation_year: 'Graduation year',
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900">{t('profile.title', 'My Profile')}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {t('profile.help', 'This helps us suggest schemes that may fit you. Do not enter your Aadhaar number.')}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('profile.fullName', 'Full name')}>
            <input className={inputCls} value={f.full_name ?? ''} onChange={set('full_name')} />
          </Field>
          <Field label={t('profile.dob', 'Date of birth')}>
            <input type="date" className={inputCls} value={f.date_of_birth ?? ''} onChange={set('date_of_birth')} />
          </Field>
          <Field label={t('profile.gender', 'Gender')}>
            <select className={inputCls} value={f.gender ?? ''} onChange={set('gender')}>
              <option value="">–</option>
              {GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label={t('profile.category', 'Social category')}>
            <select className={inputCls} value={f.social_category ?? ''} onChange={set('social_category')}>
              <option value="">–</option>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label={t('profile.mobile', 'Mobile number (optional)')}>
            <input inputMode="numeric" maxLength={10} className={inputCls} value={f.mobile ?? ''} onChange={set('mobile')} />
          </Field>
          <Field label={t('profile.language', 'Preferred language')}>
            <select className={inputCls} value={f.preferred_language ?? 'en'} onChange={set('preferred_language')}>
              {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('profile.state', 'State')}>
            <input className={inputCls} value={f.state ?? ''} onChange={set('state')} />
          </Field>
          <Field label={t('profile.district', 'District')}>
            <input className={inputCls} value={f.district ?? ''} onChange={set('district')} />
          </Field>
          <Field label={t('profile.taluk', 'Taluk')}>
            <input className={inputCls} value={f.taluk ?? ''} onChange={set('taluk')} />
          </Field>
          <Field label={t('profile.village', 'Village or city')}>
            <input className={inputCls} value={f.village_or_city ?? ''} onChange={set('village_or_city')} />
          </Field>
          <Field label={t('profile.area', 'Area type')}>
            <select className={inputCls} value={f.location_type ?? ''} onChange={set('location_type')}>
              <option value="">–</option>
              <option value="rural">Rural</option>
              <option value="urban">Urban</option>
            </select>
          </Field>
          <Field label={t('profile.income', 'Annual family income (Rs)')}>
            <input inputMode="numeric" className={inputCls} value={f.annual_family_income ?? ''} onChange={set('annual_family_income')} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('profile.occupation', 'Occupation')}>
            <select className={inputCls} value={f.occupation ?? ''} onChange={set('occupation')}>
              <option value="">–</option>
              {OCCUPATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label={t('profile.education', 'Education')}>
            <select className={inputCls} value={f.education_level ?? ''} onChange={set('education_level')}>
              <option value="">–</option>
              {EDUCATION.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          {extraKeys.map((k) => (
            <Field key={k} label={extraLabels[k]}>
              <input className={inputCls} value={extra[k] ?? ''} onChange={setX(k)} />
            </Field>
          ))}
        </div>

        {!alreadyConsented && (
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              {t(
                'auth.consent',
                'I agree to JanSahayak AI using the details I enter to suggest schemes and answer my questions. I understand this is guidance, not an official decision. I will not enter my Aadhaar number.',
              )}
            </span>
          </label>
        )}

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {saved && <p className="text-sm text-brand-700">{t('profile.saved', 'Profile saved.')}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {busy ? '…' : t('profile.save', 'Save profile')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/schemes')}
            className="rounded-xl border border-navy-700 px-5 py-2.5 font-semibold text-navy-700 hover:bg-slate-50"
          >
            {t('hero.explore')}
          </button>
        </div>
      </form>
    </div>
  )
}