export const colour = {
  background: '#0f141c',
  surface: '#171e28',
  surfaceRaised: '#202938',
  border: '#2d394a',
  text: '#f3f6fa',
  textMuted: '#9ba9ba',
  accent: '#7f8cff',
  success: '#55c7a7',
  warning: '#e8b15d',
  danger: '#ed6c78',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
} as const;

export const motion = {
  feedbackMs: 150,
  panelMs: 220,
  easing: [0.22, 1, 0.36, 1] as const,
} as const;

export const statusTone = {
  'checked-in': 'neutral',
  diagnosing: 'accent',
  'awaiting-approval': 'warning',
  'in-repair': 'accent',
  'quality-check': 'warning',
  'ready-for-delivery': 'success',
  delivered: 'success',
  cancelled: 'danger',
} as const;
