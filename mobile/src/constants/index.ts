import Constants from 'expo-constants';

export const HERMES_BASE_URL: string =
  (Constants.expoConfig?.extra?.hermesBaseUrl as string) ?? 'http://100.125.69.27:9119';

export const SESSION_TOKEN_KEY = 'hermes_session_token';
export const BASE_URL_KEY = 'hermes_base_url';

export const COLORS = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  border: '#2a2a2a',
  accent: '#e0e0e0',
  textPrimary: '#e0e0e0',
  textSecondary: '#888888',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#444444',
  inputBg: '#111111',
  drawerBg: '#0d0d0d',
} as const;
