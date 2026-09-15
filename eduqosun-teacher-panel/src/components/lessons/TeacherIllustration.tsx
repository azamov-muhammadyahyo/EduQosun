/** Noutbuk ortidagi o'qituvchi — tashqi rasmga bog'liq bo'lmagan SVG illyustratsiya */
export function TeacherIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden="true" focusable="false">
      {/* Fon doirasi va bezak nuqtalari */}
      <circle cx="58" cy="54" r="40" className="fill-blue-100 dark:fill-blue-500/20" />
      <circle cx="16" cy="24" r="3" className="fill-blue-200 dark:fill-blue-500/30" />
      <circle cx="104" cy="20" r="2" className="fill-blue-300 dark:fill-blue-400/40" />

      {/* Tana (ko'ylak) */}
      <path d="M34 90 C34 64 42 52 56 52 C70 52 78 64 78 90 Z" className="fill-blue-500" />
      <path d="M50 52 L56 62 L62 52 Z" className="fill-white/80 dark:fill-slate-200" />

      {/* Bo'yin va bosh */}
      <rect x="52" y="42" width="8" height="11" rx="3" className="fill-orange-200" />
      <circle cx="56" cy="34" r="11" className="fill-orange-200" />

      {/* Soch (turmak bilan) */}
      <circle cx="45" cy="24" r="6" className="fill-slate-800 dark:fill-slate-900" />
      <path
        d="M44 36 C42 22 50 16 58 17 C66 18 70 25 68 34 C66 29 61 26 55 27 C50 28 47 32 47 40 Z"
        className="fill-slate-800 dark:fill-slate-900"
      />

      {/* Qo'l — noutbuk klaviaturasiga */}
      <path d="M70 66 Q80 74 90 76" className="stroke-orange-200" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Stol */}
      <rect x="18" y="86" width="92" height="5" rx="2.5" className="fill-slate-300 dark:fill-slate-600" />

      {/* Noutbuk */}
      <path d="M80 56 L106 56 L102 80 L76 80 Z" className="fill-slate-700 dark:fill-slate-500" />
      <circle cx="91" cy="68" r="2.5" className="fill-blue-300" />
      <rect x="70" y="80" width="40" height="6" rx="2" className="fill-slate-400 dark:fill-slate-400" />
    </svg>
  )
}
