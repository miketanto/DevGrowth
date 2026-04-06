export const colors = {
  // Backgrounds
  bg: '#080B11',
  surface: '#111820',
  surfaceRaised: '#161D28',
  surfaceHover: '#1C2433',

  // Borders
  border: '#1E2736',
  borderLight: '#263042',

  // Text
  text: '#E2E8F0',
  textSoft: '#94A3B8',
  textMuted: '#64748B',
  textDim: '#475569',

  // Primary: Electric Teal
  teal: '#2DD4BF',
  tealBright: '#5EEAD4',
  tealDim: '#0F766E',
  tealGlow: 'rgba(45, 212, 191, 0.08)',
  tealGlow2: 'rgba(45, 212, 191, 0.15)',

  // Amber: Streaks
  amber: '#FBBF24',
  amberDim: '#92400E',
  amberGlow: 'rgba(251, 191, 36, 0.1)',

  // Blue: AI
  blue: '#38BDF8',
  blueDim: '#0C4A6E',
  blueGlow: 'rgba(56, 189, 248, 0.08)',

  // Purple: Mastery
  purple: '#A78BFA',
  purpleDim: '#4C1D95',
  purpleGlow: 'rgba(167, 139, 250, 0.08)',

  // Rose: Alerts / low
  rose: '#FB7185',
  roseGlow: 'rgba(251, 113, 133, 0.1)',
} as const;

export type ColorToken = keyof typeof colors;
