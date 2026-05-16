type PlinkLogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function PlinkLogo({ className = '', showWordmark = true }: PlinkLogoProps) {
  return (
    <div className={`plink-logo ${className}`.trim()} aria-label="Plink" role="img">
      <svg className="plink-logo-mark" viewBox="0 0 92 78" aria-hidden="true">
        {/* Yellow bubble (back) */}
        <path
          className="plink-logo-bubble-yellow"
          d="M55 22c16.1 0 29 10.7 29 24 0 7.1-3.7 13.5-9.7 17.9l2.2 9.1-10.4-4.2c-3.4.8-7.1 1.2-11 1.2-16.1 0-29-10.7-29-24S38.9 22 55 22Z"
        />
        {/* Blue bubble (front) */}
        <path
          className="plink-logo-bubble-blue"
          d="M37.5 8C19.3 8 5 20.5 5 36c0 8.2 4 15.6 10.4 20.7L12.6 69l13.3-5.6c3.6.9 7.5 1.4 11.6 1.4 18.2 0 32.5-12.5 32.5-28.4C70 20.5 55.7 8 37.5 8Z"
        />
        {/* Paper airplane inside blue bubble */}
        <path className="plink-logo-plane" d="M14 42 L42 22 L38 33 L14 42 Z" />
        <path className="plink-logo-plane-wing" d="M38 33 L33 47 L14 42 Z" />
        {/* Notification dot */}
        <circle className="plink-logo-dot" cx="72.5" cy="11" r="8.5" />
      </svg>
      {showWordmark && <span className="plink-logo-word">Plink</span>}
    </div>
  );
}
