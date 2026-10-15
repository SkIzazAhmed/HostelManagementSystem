import { useId } from 'react';

// DormDesk brand mark: a roofline over a bed on an indigo → purple tile.
// Kept in sync with public/favicon.svg so the browser tab and in-app logo match.
export function LogoMark({ className = 'w-10 h-10', title }) {
  const gradientId = `dormdesk-logo-${useId().replace(/:/g, '')}`;
  const a11yProps = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };

  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      focusable="false"
      {...a11yProps}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <g fill="none" stroke="#ffffff" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 13 16 5.5 26 13" />
        <path d="M8.5 15v10" />
        <path d="M8.5 18h12a3 3 0 0 1 3 3v4" />
        <path d="M8.5 22h15" />
        <path d="M12.5 18v4" />
      </g>
    </svg>
  );
}

// Mark + "DormDesk" wordmark, with an optional tagline (e.g. "Student Portal").
// The wordmark is real text, so the mark itself stays decorative.
export function Logo({ tagline, className = '', markClassName = 'w-10 h-10', nameClassName = 'font-bold text-lg' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark className={markClassName} />
      <div className="leading-tight">
        <span className={`block ${nameClassName}`}>DormDesk</span>
        {tagline && <span className="block text-xs text-muted-foreground">{tagline}</span>}
      </div>
    </div>
  );
}
