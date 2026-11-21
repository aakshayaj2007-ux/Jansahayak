import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import { LANGUAGES, setLanguage } from '../i18n'
import { useAuth } from '../auth/AuthContext'

const LINKS = [
  { to: '/', key: 'nav.home' },
  { to: '/schemes', key: 'nav.schemes' },
  { to: '/ask', key: 'hero.askAi' },
  { to: '/how-it-works', key: 'nav.how' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
]

function LanguageSelect() {
  const { t, i18n } = useTranslation()
  return (
    <>
      <label htmlFor="lang-select" className="sr-only">
        {t('nav.language')}
      </label>
      <select
        id="lang-select"
        value={i18n.language}
        onChange={(e) => setLanguage(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-navy-700"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} disabled={!l.ready}>
            {l.native}
            {l.ready ? '' : ` (${t('common.comingSoon')})`}
          </option>
        ))}
      </select>
    </>
  )
}

export default function Navbar() {
  const { t } = useTranslation()
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-2 py-1 text-sm rounded-md ${
      isActive ? 'font-semibold text-brand-700' : 'text-slate-700 hover:text-brand-700'
    }`

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  const authLinks = session ? (
    <>
      <Link to="/profile" onClick={() => setOpen(false)} className="text-sm font-medium text-navy-700 hover:underline">
        {t('profile.title', 'My Profile')}
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
      >
        {t('auth.signOut', 'Sign out')}
      </button>
    </>
  ) : (
    <>
      <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-navy-700 hover:underline">
        {t('nav.login')}
      </Link>
      <Link
        to="/register"
        onClick={() => setOpen(false)}
        className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
      >
        {t('nav.register')}
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" aria-label="JanSahayak AI">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
              {t(l.key)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSelect />
          {authLinks}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-navy-900 lg:hidden"
          aria-label={t('nav.menu')}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 py-3" aria-label="Mobile">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {t(l.key)}
              </NavLink>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSelect />
            {authLinks}
          </div>
        </div>
      )}
    </header>
  )
}