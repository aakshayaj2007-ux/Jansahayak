import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { setLanguage } from '../i18n'
import { KARNATAKA_DISTRICTS, TALUK_SUGGESTIONS } from '../lib/karnataka'

type Form = Record<string, string>
type Opt = [string, string]

const OCCUPATIONS: Opt[] = [
  ['farmer', 'Farmer'],
  ['student', 'College student'],
  ['postgraduate_student', 'Postgraduate student'],
  ['private_employee', 'Private employee'],
  ['government_employee', 'Government employee'],
  ['unemployed_graduate', 'Unemployed graduate'],
]
const EDUCATION: Opt[] = [
  ['10th', '10th'],
  ['12th', '12th'],
  ['diploma', 'Diploma'],
  ['undergraduate', 'Undergraduate'],
  ['postgraduate', 'Postgraduate'],
  ['other', 'Other'],
]
const GENDERS: Opt[] = [
  ['female', 'Female'],
  ['male', 'Male'],
  ['other', 'Other'],
]
const CATEGORIES: Opt[] = [
  ['general', 'General'],
  ['obc', 'OBC'],
  ['sc', 'SC'],
  ['st', 'ST'],
  ['ews', 'EWS (Economically Weaker Section)'],
]
// Kannada and Hindi names are written as Unicode escapes on purpose.
const LANGS: Opt[] = [
  ['en', 'English'],
  ['kn', '\u0C95\u0CA8\u0CCD\u0CA8\u0CA1'],
  ['hi', '\u0939\u093F\u0928\u094D\u0926\u0940'],
]
const AREAS: Opt[] = [
  ['rural', 'Rural (village)'],
  ['urban', 'Urban (town or city)'],
]
const LAND: Opt[] = [
  ['marginal', 'Marginal (below 1 hectare)'],
  ['small', 'Small (1 to 2 hectares)'],
  ['semi_medium', 'Semi-medium (2 to 4 hectares)'],
  ['medium', 'Medium (4 to 10 hectares)'],
  ['large', 'Large (above 10 hectares)'],
  ['landless_tenant', 'No own land (tenant or sharecropper)'],
]
const IRRIGATION: Opt[] = [
  ['rainfed', 'Rainfed'],
  ['borewell', 'Borewell'],
  ['canal', 'Canal'],
  ['tank_or_well', 'Tank or open well'],
  ['mixed', 'More than one source'],
]
const INSTITUTIONS: Opt[] = [
  ['government', 'Government'],
  ['aided', 'Government aided'],
  ['private', 'Private'],
]
const YEARS: Opt[] = [
  ['1', '1st year'],
  ['2', '2nd year'],
  ['3', '3rd year'],
  ['4', '4th year'],
  ['5', '5th year or above'],
]
const DISTRICT_OPTS: Opt[] = KARNATAKA_DISTRICTS.map((d) => [d, d])

const EXTRA_KEYS: Record<string, string[]> = {
  farmer: ['land_category', 'crops', 'irrigation'],
  student: ['course', 'institution_type', 'study_year'],
  postgraduate_student: ['course', 'institution_type', 'study_year'],
  private_employee: ['employment_sector'],
  government_employee: ['employment_sector'],
  unemployed_graduate: ['degree', 'graduation_year'],
}
const EXTRA_LABELS: Record<string, string> = {
  land_category: 'Landholding category',
  crops: 'Crops grown',
  irrigation: 'Irrigation type',
  course: 'Course',
  institution_type: 'Institution type',
  study_year: 'Year of study',
  employment_sector: 'Employment sector (for example IT, factory, shop)',
  degree: 'Degree',
  graduation_year: 'Graduation year',
}

const STEP_TITLES = ['About you', 'Location and income', 'Occupation and consent']
const LAST = STEP_TITLES.length - 1

const todayISO = new Date().toISOString().slice(0, 10)
const minDobISO = `${new Date().getFullYear() - 110}-01-01`

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

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        <div className="mt-1 font-normal">{children}</div>
      </label>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function Sel({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  options: Opt[]
}) {
  const known = options.some(([v]) => v === value)
  return (
    <select className={inputCls} value={value} onChange={onChange}>
      <option value="">-- Select --</option>
      {value && !known && <option value={value}>{value}</option>}
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  )
}

export default function Profile() {
  const { t } = useTranslation()
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
  const [step, setStep] = useState(0)

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
            if (v === null || typeof v === 'object') continue
            next[k] = k === 'annual_family_income' ? String(Number(v)) : String(v)
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
  const setDigits = (k: string, max: number) => (e: { target: { value: string } }) =>
    setF((p) => ({ ...p, [k]: e.target.value.replace(/\D/g, '').slice(0, max) }))
  const onDistrict = (e: ChangeEvent<HTMLSelectElement>) =>
    setF((p) => ({ ...p, district: e.target.value, taluk: '' }))

  const isKA = (f.state ?? '').trim().toLowerCase() === 'karnataka'
  const taluks = isKA ? (TALUK_SUGGESTIONS[f.district ?? ''] ?? []) : []
  const age = ageFrom(f.date_of_birth ?? '')

  function validateStep(n: number): string {
    if (n === 0) {
      if (!f.full_name?.trim()) return t('profile.needName', 'Please enter your full name.')
      const a = ageFrom(f.date_of_birth ?? '')
      if (a === null || a < 5 || a > 110) return t('profile.badDob', 'Please enter a valid date of birth.')
      if (f.mobile && !/^[6-9]\d{9}$/.test(f.mobile)) {
        return t('profile.badMobile', 'Mobile number must be 10 digits.')
      }
    }
    if (n === 1) {
      if (!f.state?.trim()) return 'Please enter your state.'
      if (!f.district?.trim()) return 'Please choose your district.'
      if (!f.location_type) return 'Please choose rural or urban.'
      if (f.annual_family_income === undefined || f.annual_family_income === '') {
        return 'Please enter your annual family income. Enter 0 if there is none.'
      }
      const inc = Number(f.annual_family_income)
      if (isNaN(inc) || inc < 0) return t('profile.badIncome', 'Income must be a number, 0 or more.')
    }
    if (n === 2) {
      if (!f.occupation) return 'Please choose your occupation.'
      if (!f.education_level) return 'Please choose your education level.'
      const gy = extra.graduation_year?.trim()
      if (f.occupation === 'unemployed_graduate' && gy) {
        const y = Number(gy)
        if (!/^\d{4}$/.test(gy) || y < 1980 || y > new Date().getFullYear() + 1) {
          return 'Please enter a valid 4-digit graduation year.'
        }
      }
      if (!alreadyConsented && !consent) return t('auth.needConsent', 'Please accept the consent to continue.')
    }
    return ''
  }

  function goNext() {
    const msg = validateStep(step)
    setError(msg)
    if (msg) return
    setSaved(false)
    setStep((s) => Math.min(LAST, s + 1))
    window.scrollTo({ top: 0 })
  }

  function goBack() {
    setError('')
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0 })
  }

  async function save() {
    setSaved(false)
    for (let i = 0; i <= LAST; i++) {
      const msg = validateStep(i)
      if (msg) {
        setStep(i)
        setError(msg)
        return
      }
    }
    setError('')
    if (!userId) return

    const income = Number(f.annual_family_income)
    const keys = EXTRA_KEYS[f.occupation] ?? []
    const extraOut: Form = {}
    for (const k of keys) if (extra[k]?.trim()) extraOut[k] = extra[k].trim()

    const required = [
      f.full_name, f.date_of_birth, f.gender, f.state, f.district,
      f.location_type, f.occupation, f.education_level,
    ]
    const complete = required.every((v) => v && String(v).trim() !== '')

    const payload: Record<string, unknown> = {
      full_name: f.full_name.trim(),
      date_of_birth: f.date_of_birth,
      age: ageFrom(f.date_of_birth ?? ''),
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
    window.scrollTo({ top: 0 })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (step < LAST) goNext()
    else void save()
  }

  function renderExtra(k: string) {
    const v = extra[k] ?? ''
    if (k === 'land_category') return <Sel value={v} onChange={setX(k)} options={LAND} />
    if (k === 'irrigation') return <Sel value={v} onChange={setX(k)} options={IRRIGATION} />
    if (k === 'institution_type') return <Sel value={v} onChange={setX(k)} options={INSTITUTIONS} />
    if (k === 'study_year') return <Sel value={v} onChange={setX(k)} options={YEARS} />
    if (k === 'graduation_year') {
      return <input inputMode="numeric" maxLength={4} className={inputCls} value={v} onChange={setX(k)} />
    }
    return <input className={inputCls} value={v} onChange={setX(k)} />
  }

  if (loading) return <p className="px-4 py-20 text-center text-slate-600">Loading...</p>

  const extraKeys = EXTRA_KEYS[f.occupation] ?? []
  const occLabel = OCCUPATIONS.find(([v]) => v === f.occupation)?.[1] ?? '-'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900">{t('profile.title', 'My Profile')}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {t('profile.help', 'This helps us suggest schemes that may fit you. Do not enter your Aadhaar number.')}
      </p>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">
          Step {step + 1} of {STEP_TITLES.length}: {STEP_TITLES[step]}
        </p>
        <div
          className="mt-2 h-2 w-full rounded-full bg-slate-200"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEP_TITLES.length}
          aria-valuenow={step + 1}
        >
          <div
            className="h-2 rounded-full bg-brand-700 transition-all"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </div>
      </div>

      {saved && (
        <div className="mt-5 rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-semibold">{t('profile.saved', 'Profile saved.')}</p>
          <p className="mt-1">
            <Link to="/schemes" className="font-medium underline">
              Open Schemes and choose "Schemes for me"
            </Link>{' '}
            to see what may fit you.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('profile.fullName', 'Full name')}>
              <input className={inputCls} value={f.full_name ?? ''} onChange={set('full_name')} maxLength={100} />
            </Field>
            <Field
              label={t('profile.dob', 'Date of birth')}
              hint={age !== null && age >= 0 ? `Your age: ${age} years` : 'Used to check age limits of schemes.'}
            >
              <input
                type="date"
                className={inputCls}
                min={minDobISO}
                max={todayISO}
                value={f.date_of_birth ?? ''}
                onChange={set('date_of_birth')}
              />
            </Field>
            <Field label={t('profile.gender', 'Gender')} hint="Why we ask: some schemes are only for women.">
              <Sel value={f.gender ?? ''} onChange={set('gender')} options={GENDERS} />
            </Field>
            <Field
              label={t('profile.category', 'Social category')}
              hint="Why we ask: some scholarships and subsidies depend on category. Optional."
            >
              <Sel value={f.social_category ?? ''} onChange={set('social_category')} options={CATEGORIES} />
            </Field>
            <Field label={t('profile.mobile', 'Mobile number (optional)')} hint="10 digits. We do not send OTPs yet.">
              <input
                inputMode="numeric"
                maxLength={10}
                className={inputCls}
                value={f.mobile ?? ''}
                onChange={setDigits('mobile', 10)}
              />
            </Field>
            <Field label={t('profile.language', 'Preferred language')}>
              <Sel value={f.preferred_language ?? 'en'} onChange={set('preferred_language')} options={LANGS} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('profile.state', 'State')}
              hint="Karnataka schemes are supported first. Other states can be typed."
            >
              <input className={inputCls} value={f.state ?? ''} onChange={set('state')} />
            </Field>
            <Field label={t('profile.district', 'District')}>
              {isKA ? (
                <Sel value={f.district ?? ''} onChange={onDistrict} options={DISTRICT_OPTS} />
              ) : (
                <input className={inputCls} value={f.district ?? ''} onChange={set('district')} />
              )}
            </Field>
            <Field label={t('profile.taluk', 'Taluk')} hint="Optional. Start typing to see suggestions.">
              <input className={inputCls} list="taluk-options" value={f.taluk ?? ''} onChange={set('taluk')} />
              <datalist id="taluk-options">
                {taluks.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </Field>
            <Field label={t('profile.village', 'Village or city')}>
              <input className={inputCls} value={f.village_or_city ?? ''} onChange={set('village_or_city')} />
            </Field>
            <Field label={t('profile.area', 'Area type')}>
              <Sel value={f.location_type ?? ''} onChange={set('location_type')} options={AREAS} />
            </Field>
            <Field
              label={t('profile.income', 'Annual family income (Rs)')}
              hint="Total yearly income of all family members together. Why we ask: many schemes have income limits."
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Rs</span>
                <input
                  inputMode="numeric"
                  className={inputCls}
                  value={f.annual_family_income ?? ''}
                  onChange={setDigits('annual_family_income', 12)}
                />
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('profile.occupation', 'Occupation')}>
                <Sel value={f.occupation ?? ''} onChange={set('occupation')} options={OCCUPATIONS} />
              </Field>
              <Field label={t('profile.education', 'Education')}>
                <Sel value={f.education_level ?? ''} onChange={set('education_level')} options={EDUCATION} />
              </Field>
            </div>

            {extraKeys.length > 0 && (
              <div className="rounded-xl border border-brand-700/20 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-navy-900">More about your work or studies (optional)</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {extraKeys.map((k) => (
                    <Field key={k} label={EXTRA_LABELS[k]}>
                      {renderExtra(k)}
                    </Field>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
              <p className="font-semibold text-navy-900">Please check your details</p>
              <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                <div>
                  <dt className="inline font-medium">Name: </dt>
                  <dd className="inline">{f.full_name || '-'}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Age: </dt>
                  <dd className="inline">{age !== null ? age : '-'}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Place: </dt>
                  <dd className="inline">{[f.district, f.state].filter(Boolean).join(', ') || '-'}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Family income: </dt>
                  <dd className="inline">{f.annual_family_income ? `Rs ${f.annual_family_income}` : '-'}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Occupation: </dt>
                  <dd className="inline">{occLabel}</dd>
                </div>
              </dl>
            </div>

            {!alreadyConsented && (
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  {t(
                    'auth.consent',
                    'I agree to JanSahayak AI using the details I enter to suggest schemes and answer my questions. I understand this is guidance, not an official decision. I will not enter my Aadhaar number.',
                  )}
                </span>
              </label>
            )}
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-navy-700 px-5 py-2.5 font-semibold text-navy-700 hover:bg-slate-50"
            >
              Back
            </button>
          )}
          {step < LAST ? (
            <button
              type="submit"
              className="rounded-xl bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-800"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {busy ? 'Saving...' : t('profile.save', 'Save profile')}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}