/**
 * Qualify logo — a "Q" whose tail is a tick: you learn it, you're qualified.
 * variant: "full" (mark + wordmark) | "mark"
 * tone: "dark" (ink wordmark, for light backgrounds) | "light" (white wordmark, for dark backgrounds)
 */
export function LogoMark({ size = 34, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="13" fill="#2B3FE0" />
      <circle cx="22.5" cy="22" r="11" fill="none" stroke="#FFFFFF" strokeWidth="5.2" />
      <path d="M25 28.5l5 5.5L41 20" fill="none" stroke="#2B3FE0" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 28.5l5 5.5L41 20" fill="none" stroke="#FFD84D" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ variant = 'full', tone = 'dark', size = 34, className = '' }) {
  if (variant === 'mark') return <LogoMark size={size} className={className} />;
  return (
    <span className={`q-logo q-logo-${tone} ${className}`}>
      <LogoMark size={size} />
      <span className="q-wordmark" style={{ fontSize: size * 0.72 }}>Qualify</span>
    </span>
  );
}
