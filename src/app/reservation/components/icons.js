export const Arrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowBack = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

export const Check = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const Info = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 018 0v3" />
  </svg>
);

export const IconIndiv = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" />
  </svg>
);

export const IconDuo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="8" r="3.5" />
    <circle cx="17" cy="9" r="3" />
    <path d="M2 20v-1a5 5 0 015-5h4a5 5 0 015 5v1" />
  </svg>
);

export const IconGroup = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="8" r="3" />
    <path d="M2 20v-1a4 4 0 014-4h2M22 20v-1a4 4 0 00-4-4h-2M9 20v-1a4 4 0 014-4h-2a4 4 0 00-4 4v1" />
  </svg>
);

export const TYPE_ICON = { INDIVIDUEL: IconIndiv, DUO: IconDuo, GROUPE: IconGroup };