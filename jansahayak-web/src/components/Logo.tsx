export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 3 6 8v10c0 9 6 16 14 19 8-3 14-10 14-19V8L20 3z" fill="#166534" />
        <circle cx="20" cy="12.5" r="3" fill="#fff" />
        <circle cx="13.5" cy="15.5" r="2.3" fill="#cfe5d6" />
        <circle cx="26.5" cy="15.5" r="2.3" fill="#cfe5d6" />
        <path
          d="M9.5 24.5c4-2 7-2 10.5 0 3.5-2 6.5-2 10.5 0-1 5.5-5.5 8.5-10.5 10.5-5-2-9.5-5-10.5-10.5z"
          fill="#fff"
        />
      </svg>
      <span className="text-xl font-bold tracking-tight text-navy-900">
        JanSahayak <span className="text-brand-700">AI</span>
      </span>
    </span>
  )
}