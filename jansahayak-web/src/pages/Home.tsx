import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Briefcase, GraduationCap, Landmark, Lightbulb, Sprout, ShieldAlert } from 'lucide-react'

const WHO = [
  { key: 'farmers', Icon: Sprout },
  { key: 'students', Icon: GraduationCap },
  { key: 'pg', Icon: BookOpen },
  { key: 'private', Icon: Briefcase },
  { key: 'govt', Icon: Landmark },
  { key: 'grads', Icon: Lightbulb },
]

const STEPS = ['s1', 's2', 's3', 's4']

export default function Home() {
  const { t } = useTranslation()

  return (
    <>
      <section className="bg-brand-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-3xl font-bold leading-tight text-brand-800 sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-700">{t('hero.text')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800"
            >
              {t('hero.getStarted')}
            </Link>
            <Link
              to="/schemes"
              className="rounded-xl border border-navy-700 bg-white px-6 py-3 font-semibold text-navy-700 hover:bg-slate-50"
            >
              {t('hero.explore')}
            </Link>
            <Link
              to="/ask"
              className="rounded-xl bg-navy-700 px-6 py-3 font-semibold text-white hover:bg-navy-900"
            >
              {t('hero.askAi')}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-navy-900 sm:text-3xl">{t('who.title')}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHO.map(({ key, Icon }) => (
            <article key={key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="inline-flex rounded-xl bg-brand-100 p-3 text-brand-700">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-navy-900">{t(`who.${key}.title`)}</h3>
              <p className="mt-1 text-slate-600">{t(`who.${key}.desc`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold text-navy-900 sm:text-3xl">{t('how.title')}</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s} className="rounded-2xl border border-slate-200 bg-surface p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 font-medium text-navy-900">{t(`how.${s}`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <ShieldAlert className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
          <p className="text-sm">{t('notice')}</p>
        </div>
      </section>
    </>
  )
}