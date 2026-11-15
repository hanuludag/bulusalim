// Tek, ince çizgi ikon seti. Sadece sekme çubuğu, paylaş ve ⋯ menüsünde kullanılır.
const common = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const ShareIcon = ({ size = 22 }: { size?: number }) => (
  <svg {...common} width={size} height={size}>
    <path d="M12 15V3" />
    <path d="M7 8l5-5 5 5" />
    <path d="M5 12v8h14v-8" />
  </svg>
);

export const ListIcon = () => (
  <svg {...common}>
    <path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1" />
  </svg>
);

export const CalendarIcon = () => (
  <svg {...common}>
    <rect x="3" y="5" width="18" height="16" rx="1" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const FlagIcon = () => (
  <svg {...common}>
    <path d="M5 21V4h12l-2.5 4L17 12H5" />
  </svg>
);

export const DotsIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="4" y="11" width="2.4" height="2.4" />
    <rect x="10.8" y="11" width="2.4" height="2.4" />
    <rect x="17.6" y="11" width="2.4" height="2.4" />
  </svg>
);
