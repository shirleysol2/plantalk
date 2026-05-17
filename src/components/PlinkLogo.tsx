type PlinkLogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function PlinkLogo({ className = '', showWordmark = true }: PlinkLogoProps) {
  return (
    <div className={`plink-logo ${className}`.trim()} aria-label="Plink" role="img">
      <svg className="plink-logo-mark" viewBox="0 0 100 88" aria-hidden="true">
        {/* Speech bubble */}
        <path
          className="plink-logo-speech"
          d="M33 9 H67 Q80 9 80 21 V26 Q80 36 67 36 H33 Q20 36 20 26 V21 Q20 9 33 9 Z"
        />
        <path
          className="plink-logo-speech"
          d="M43 35 L47 46 L57 35 Z"
        />
        {/* Cover inner stroke at tail junction */}
        <path fill="#DCF4F2" d="M44 34 L47 44 L56 34 Z" />
        {/* Dots inside bubble */}
        <circle className="plink-logo-speech-dot" cx="38" cy="22" r="3.2" />
        <circle className="plink-logo-speech-dot" cx="50" cy="22" r="3.2" />
        <circle className="plink-logo-speech-dot" cx="62" cy="22" r="3.2" />

        {/* Left blob — coral (shy) */}
        <path
          className="plink-logo-blob-coral"
          d="M20 50 C31 47 37 54 37 63 C37 73 31 78 20 78 C9 78 3 73 3 63 C3 54 9 47 20 50 Z"
        />
        <ellipse cx="25" cy="55" rx="6" ry="4" fill="white" opacity=".22" />
        <circle cx="15" cy="61" r="2.6" fill="#1A1212" />
        <circle cx="25" cy="61" r="2.6" fill="#1A1212" />
        <circle cx="10" cy="68" r="5.5" fill="#C84040" opacity=".22" />
        <circle cx="30" cy="68" r="5.5" fill="#C84040" opacity=".22" />
        <ellipse cx="20" cy="70" rx="3" ry="3.5" fill="#1A1212" />

        {/* Center blob — teal (main Plink character, energetic) */}
        <path
          className="plink-logo-blob-teal"
          d="M50 44 C63 41 71 50 71 62 C71 74 63 82 50 82 C37 82 29 74 29 62 C29 50 37 41 50 44 Z"
        />
        <ellipse cx="58" cy="51" rx="8" ry="5.5" fill="white" opacity=".18" />
        <circle cx="42" cy="59" r="6.5" fill="white" />
        <circle cx="43" cy="60.5" r="4.5" fill="#141414" />
        <circle cx="44.8" cy="58.8" r="1.6" fill="white" />
        <circle cx="58" cy="59" r="6.5" fill="white" />
        <circle cx="59" cy="60.5" r="4.5" fill="#141414" />
        <circle cx="60.8" cy="58.8" r="1.6" fill="white" />
        <circle cx="35" cy="68" r="7.5" fill="#2A8A84" opacity=".22" />
        <circle cx="65" cy="68" r="7.5" fill="#2A8A84" opacity=".22" />
        <path d="M43 70 Q50 77 57 70" stroke="#141414" fill="none" strokeWidth="2.5" strokeLinecap="round" />

        {/* Right blob — yellow (happy ^^) */}
        <path
          className="plink-logo-blob-yellow"
          d="M80 50 C91 47 97 54 97 63 C97 73 91 78 80 78 C69 78 63 73 63 63 C63 54 69 47 80 50 Z"
        />
        <ellipse cx="85" cy="55" rx="6" ry="4" fill="white" opacity=".24" />
        <path d="M74 61 Q77 57 80 61" stroke="#1A1212" fill="none" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M80 61 Q83 57 86 61" stroke="#1A1212" fill="none" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="70" cy="68" r="5.5" fill="#C08000" opacity=".22" />
        <circle cx="90" cy="68" r="5.5" fill="#C08000" opacity=".22" />
        <path d="M74 70 Q80 75 86 70" stroke="#1A1212" fill="none" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {showWordmark && <span className="plink-logo-word">Plink</span>}
    </div>
  );
}
