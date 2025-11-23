export function RunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M15 5.5a2 2 0 1 1 1.9 2M9.5 21l1.3-5.1-2.8-2 2.2-4.4 2.8 2.6 2-.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 10.8l-.6 3.8 3.5 3.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BikeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="6" cy="17" r="3.3" />
      <circle cx="18" cy="17" r="3.3" />
      <path d="M12 17h2l-1-5h-4l3-5 1.4 3H18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StrengthIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9v6M18 9v6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="10" width="2" height="4" rx=".6" />
      <rect x="18" y="10" width="2" height="4" rx=".6" />
      <rect x="8" y="8" width="8" height="8" rx="1.2" />
    </svg>
  );
}

export function DotIcon() {
  return <span className="h-2 w-2 rounded-full bg-current" />;
}
