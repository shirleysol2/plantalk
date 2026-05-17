type PlinkLogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function PlinkLogo({ className = '', showWordmark = true }: PlinkLogoProps) {
  return (
    <div className={`plink-logo ${className}`.trim()} aria-label="Plink" role="img">
      <svg className="plink-logo-mark" viewBox="0 0 84 66" aria-hidden="true">
        {/* Mini speech bubble from small friend */}
        <rect x="44" y="2" width="20" height="13" rx="5" fill="#FFF0E0" />
        <path d="M59 14 L62 22 L53 14 Z" fill="#FFF0E0" />
        <circle cx="50" cy="8" r="1.7" fill="#FFB085" />
        <circle cx="56" cy="8" r="1.7" fill="#FFB085" />
        <circle cx="62" cy="8" r="1.7" fill="#FFB085" />

        {/* Small coral friend — upper right */}
        <ellipse cx="68" cy="20" rx="15" ry="14" fill="#FF9E85" />
        {/* Small friend eyes */}
        <circle cx="63" cy="19" r="2.2" fill="#2d1a10" />
        <circle cx="72" cy="19" r="2.2" fill="#2d1a10" />
        {/* Small friend smile */}
        <path d="M62 24 Q67 29 74 24" stroke="#2d1a10" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Small friend cheek blush */}
        <circle cx="59" cy="24" r="3.5" fill="#FF6B6B" opacity=".2" />
        <circle cx="76" cy="24" r="3.5" fill="#FF6B6B" opacity=".2" />

        {/* Big teal main blob */}
        <path
          fill="#5BBFBA"
          d="M14 32 C18 20 42 18 48 32 C54 46 46 64 30 65 C14 66 6 54 8 42 C10 32 10 42 14 32 Z"
        />
        {/* Shine */}
        <ellipse cx="40" cy="27" rx="9" ry="5.5" fill="white" opacity=".2" />
        {/* Big blob eyes */}
        <circle cx="22" cy="42" r="4.2" fill="white" />
        <circle cx="23" cy="43" r="3" fill="#142020" />
        <circle cx="24.4" cy="41.4" r="1.1" fill="white" />
        <circle cx="37" cy="42" r="4.2" fill="white" />
        <circle cx="38" cy="43" r="3" fill="#142020" />
        <circle cx="39.4" cy="41.4" r="1.1" fill="white" />
        {/* Big blob smile */}
        <path d="M22 51 Q30 59 38 51" stroke="#142020" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        {/* Cheek blush */}
        <circle cx="16" cy="50" r="5.5" fill="#2A8A84" opacity=".18" />
        <circle cx="42" cy="50" r="5.5" fill="#2A8A84" opacity=".18" />
      </svg>
      {showWordmark && <span className="plink-logo-word">Plink</span>}
    </div>
  );
}
