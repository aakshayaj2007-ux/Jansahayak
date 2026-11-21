import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t('auth.badEmail', 'Please enter a valid email address.'))
      return
    }
    if (password.length < 8) {
      setError(t('auth.shortPw', 'Password must be at least 8 characters.'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.pwMismatch', 'The two passwords do not match.'))
      return
    }
    if (!consent) {
      setError(t('auth.needConsent', 'Please accept the consent to continue.'))
      return
    }

    setBusy(true)
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/profile` },
    })
    setBusy(false)

    if (err) {
      setError(err.message)
      return
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError(t('auth.exists', 'This email is already registered. Please log in.'))
      return
    }
    if (data.session) {
      navigate('/profile', { replace: true })
    } else {
      setInfo(
        t('auth.checkEmail', 'Account created. Please check your email and confirm it, then log in.'),
      )
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-navy-900">{t('nav.register')}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            {t('auth.email', 'Email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            {t('auth.password', 'Password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
            {t('auth.confirmPw', 'Confirm password')}
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            {t(
              'auth.consent',
              'I agree to JanSahayak AI using the details I enter to suggest schemes and answer my questions. I understand this is guidance, not an official decision. I will not enter my Aadhaar number.',
            )}
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {info && <p className="text-sm text-brand-700">{info}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand-700 px-4 py-2.5 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {busy ? '…' : t('nav.register')}
        </button>
        <p className="text-sm text-slate-600">
          {t('auth.haveAccount', 'Already have an account?')}{' '}
          <Link to="/login" className="font-medium text-navy-700 hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </form>
    </div>
  )
}