import { useTranslation } from 'react-i18next'

export default function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-navy-900">{t(titleKey)}</h1>
      <p className="mt-3 text-slate-600">{t('common.placeholder')}</p>
    </div>
  )
}