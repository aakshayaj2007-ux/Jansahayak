import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import Logo from '../components/Logo'
import { LANGUAGES, setLanguage } from '../i18n'

export default function LanguagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 py-10">
      <Logo size={44} />
      <Globe className="mt-8 text-brand-700" size={32} aria-hidden="true" />
      <h1 className="mt-3 text-center text-3xl font-bold text-navy-900">{t('lang.title')}</h1>
      <p className="mt-1 text-slate-600">{t('lang.subtitle')}</p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            disabled={!l.ready}
            onClick={() => {
              setLanguage(l.code)
              navigate('/')
            }}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition enabled:hover:border-brand-600 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-navy-700"
          >
            <span className="block text-2xl font-semibold text-navy-900">{l.native}</span>
            {!l.ready && (
              <span className="mt-1 block text-xs text-slate-500">{t('common.comingSoon')}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}