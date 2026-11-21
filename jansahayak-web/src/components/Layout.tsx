import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './Navbar'
import Logo from './Logo'

export default function Layout() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-6">
          <Logo size={28} />
          <p className="text-sm text-slate-600">{t('notice')}</p>
          <div className="flex gap-4 text-sm">
            <Link to="/privacy" className="text-navy-700 hover:underline">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="text-navy-700 hover:underline">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}