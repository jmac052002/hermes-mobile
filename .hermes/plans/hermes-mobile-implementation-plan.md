# Hermes Mobile — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a full-featured Android app that replicates all 18 screens of the Hermes Dashboard, backed by the live Hermes REST API via Tailscale.

**Architecture:**
- React Native + Expo SDK 56 + Expo Router (TypeScript, Android-only)
- Drawer navigation (mirrors the dashboard sidebar) — hamburger opens a slide-over drawer with all nav items
- Connects to the Hermes Dashboard API (default: `http://100.125.69.27:9119` via Tailscale, user-configurable)
- Auth: `X-Hermes-Session-Token` header stored in SecureStore. `auth_required: false` in `/api/status` means token is optional for loopback; app handles both modes.
- All API calls go through a single `apiClient` with automatic header injection

**Tech Stack:** React Native · Expo SDK 56 · Expo Router · TypeScript · Axios · SecureStore · React Navigation Drawer

---

## API Reference

Base URL: `http://100.125.69.27:9119` (Tailscale) — configurable via app settings

All requests use `X-Hermes-Session-Token: <token>` header.

Key endpoints used across screens:
```
GET  /api/status                         # System status, gateway state
GET  /api/sessions?limit=N&offset=N      # Session list
GET  /api/sessions/<id>/messages         # Session messages
DELETE /api/sessions/<id>                # Delete session
GET  /api/files                          # File browser
GET  /api/logs?level=INFO&limit=100      # Log stream
GET  /api/analytics                      # Token/cost analytics
GET  /api/model/info                     # Current model
GET  /api/model/options                  # Available models
POST /api/model/set                      # Change model
GET  /api/cron/jobs?profile=default      # Cron jobs
POST /api/cron/jobs/<id>/pause           # Pause cron
POST /api/cron/jobs/<id>/resume          # Resume cron
POST /api/cron/jobs/<id>/trigger         # Trigger cron
DELETE /api/cron/jobs/<id>               # Delete cron
GET  /api/skills                         # Skills list
GET  /api/tools/toolsets                 # Toolsets
GET  /api/mcp                            # MCP servers
GET  /api/messaging/platforms            # Platform channels
GET  /api/webhooks                       # Webhooks
GET  /api/profiles                       # Profiles
GET  /api/config                         # Config YAML
GET  /api/env                            # Env/API keys
GET  /api/env/reveal                     # Reveal a key value
POST /api/gateway/restart                # Restart gateway
POST /api/ops/update                     # Update Hermes
```

---

## Screens (18 total)

| Screen | API Endpoints | Key Actions |
|---|---|---|
| Sessions | /api/sessions, /api/sessions/{id}/messages | List, view messages, delete, archive |
| Files | /api/files | Browse dirs, read files, upload |
| Analytics | /api/analytics | Token/cost charts |
| Models | /api/model/info, /api/model/options | View current, switch model |
| Logs | /api/logs | Live tail, filter by level |
| Cron | /api/cron/jobs | List, pause/resume/trigger/delete jobs |
| Skills | /api/skills | List, toggle enabled/disabled |
| Plugins | /api/plugins (or /api/dashboard/plugins) | List installed plugins |
| MCP | /api/mcp | List MCP servers and tools |
| Pairing | /api/pairing | Pairing code/QR |
| Channels | /api/messaging/platforms | Platform connection status |
| Webhooks | /api/webhooks | Webhook list and management |
| System | /api/status, /api/gateway/restart | Status overview, restart, update |
| Profiles | /api/profiles | List, switch active profile |
| Config | /api/config/raw | View/edit YAML config |
| Keys | /api/env | View/set/delete API keys |
| Docs | https://claude-code.nousresearch.com/docs | WebView browser |
| Settings | local only | Base URL config, token config |

---

## Color Palette (matches dashboard)

```
Background:      #0a0a0a
Card/surface:    #1a1a1a
Border:          #2a2a2a
Accent:          #e0e0e0  (midground — off-white text)
Primary text:    #e0e0e0
Secondary text:  #666666
Success:         #10b981
Warning:         #f59e0b
Error/red:       #ef4444
Muted:           #444444
Input bg:        #111111
```

---

## Task 0: Scaffold Expo Project

**Objective:** Create the Expo SDK 56 project at `~/projects/hermes-mobile/mobile/`

**Files:**
- Create: `mobile/` (Expo scaffold)
- Create: `mobile/app.config.ts`
- Create: `mobile/.env`
- Create: `mobile/.env.example`
- Modify: `mobile/package.json` (set main to expo-router/entry)
- Create: `CLAUDE.md`
- Create: `AGENTS.md`

**Step 1: Scaffold**

```bash
cd ~/projects/hermes-mobile
npx create-expo-app@latest mobile --template blank-typescript
```

**Step 2: Install dependencies**

```bash
cd mobile
npx expo install expo-router expo-secure-store expo-constants expo-linking expo-status-bar expo-web-browser react-native-webview @react-navigation/drawer @react-navigation/native react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens
npm install axios @react-native-community/datetimepicker
```

**Step 3: Replace app.json with app.config.ts**

```typescript
// mobile/app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Hermes',
  slug: 'hermes-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'hermes',
  userInterfaceStyle: 'dark',
  platforms: ['android'],
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0a0a0a',
    },
    package: 'com.jmac052002.hermes',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    hermesBaseUrl: process.env.HERMES_BASE_URL ?? 'http://100.125.69.27:9119',
    router: {
      origin: false,
    },
  },
});
```

**Step 4: Update package.json main field**

In `mobile/package.json`, ensure `"main": "expo-router/entry"` exists.

**Step 5: Create .env files**

```bash
# mobile/.env
HERMES_BASE_URL=http://100.125.69.27:9119
```

```bash
# mobile/.env.example
HERMES_BASE_URL=http://100.125.69.27:9119
```

**Step 6: Create CLAUDE.md**

```markdown
# Hermes Mobile — Android
**Stack:** React Native · Expo SDK 56 · Expo Router · TypeScript
**Platform:** Android only (Expo managed workflow)
**Developer:** Joseph McCoy · github.com/jmac052002

## What This Is
A full-featured Android app replicating the Hermes Dashboard — 18 screens backed by the live Hermes REST API.

## API
Base URL: http://100.125.69.27:9119 (Tailscale — configurable in app Settings)
Auth: X-Hermes-Session-Token header (stored in SecureStore)

## Session Setup
```bash
cd ~/projects/hermes-mobile/mobile
npm install
npx expo start
```
```

**Step 7: Create AGENTS.md**

```markdown
# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.
```

**Step 8: Commit**

```bash
cd ~/projects/hermes-mobile
git add .
git commit -m "feat: scaffold Expo SDK 56 project"
git push origin main
```

---

## Task 1: Infrastructure — Constants, Types, ApiClient

**Objective:** Create the shared foundation: types, constants, and the Axios client

**Files:**
- Create: `mobile/src/constants/index.ts`
- Create: `mobile/src/types/index.ts`
- Create: `mobile/src/services/tokenStorage.ts`
- Create: `mobile/src/services/apiClient.ts`

**Step 1: Create directory structure**

```bash
mkdir -p mobile/src/constants mobile/src/types mobile/src/services mobile/src/context mobile/src/components mobile/src/hooks
```

**Step 2: Create `mobile/src/constants/index.ts`**

```typescript
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
```

**Step 3: Create `mobile/src/types/index.ts`**

```typescript
// Session types
export interface HermesSession {
  id: string;
  source: string;
  model: string;
  started_at: number;
  ended_at: number | null;
  message_count: number;
  tool_call_count: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number | null;
  title: string | null;
  is_active: boolean;
  preview: string | null;
  archived: boolean;
  last_active: number;
}

export interface SessionMessage {
  id: number;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
}

export interface PaginatedSessions {
  sessions: HermesSession[];
  total: number;
  has_more: boolean;
}

// Status types
export interface GatewayPlatform {
  state: 'connected' | 'disconnected' | 'error';
  error_code: string | null;
  error_message: string | null;
  updated_at: string;
}

export interface StatusResponse {
  version: string;
  release_date: string;
  gateway_running: boolean;
  gateway_state: string;
  gateway_platforms: Record<string, GatewayPlatform>;
  active_agents: number;
  active_sessions: number;
  auth_required: boolean;
  can_update_hermes: boolean;
  gateway_busy: boolean;
}

// Model types
export interface ModelInfo {
  provider: string;
  model: string;
  display_name?: string;
}

export interface ModelOption {
  provider: string;
  model: string;
  display_name: string;
  context_length?: number;
}

// Cron types
export interface CronJob {
  id: string;
  name: string | null;
  schedule: string;
  prompt: string;
  enabled: boolean;
  last_run: number | null;
  next_run: number | null;
  last_status: 'success' | 'error' | 'running' | null;
}

// Skill types
export interface SkillInfo {
  name: string;
  description: string;
  enabled: boolean;
  category: string | null;
  tags: string[];
}

// Log types
export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  logger: string;
}

// File types
export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number | null;
  modified: number | null;
}

// Env/Key types
export interface EnvVarInfo {
  set: boolean;
  masked_value: string | null;
  description: string | null;
}

// Profile types
export interface ProfileInfo {
  name: string;
  description: string | null;
  is_active: boolean;
  model: string | null;
  provider: string | null;
}

// Analytics types
export interface AnalyticsResponse {
  sessions: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  estimated_cost_usd: number;
  api_calls: number;
  tool_calls: number;
  period_days: number;
}

// MCP types
export interface McpServer {
  name: string;
  status: 'connected' | 'error' | 'disabled';
  tools_count: number;
  error?: string;
}

// Channel types
export interface ChannelPlatform {
  name: string;
  state: 'connected' | 'disconnected' | 'error';
  display_name: string;
  error_message: string | null;
}
```

**Step 4: Create `mobile/src/services/tokenStorage.ts`**

```typescript
import * as SecureStore from 'expo-secure-store';
import { SESSION_TOKEN_KEY, BASE_URL_KEY, HERMES_BASE_URL } from '../constants';

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  },

  async clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  },

  async getBaseUrl(): Promise<string> {
    const stored = await SecureStore.getItemAsync(BASE_URL_KEY);
    return stored ?? HERMES_BASE_URL;
  },

  async setBaseUrl(url: string): Promise<void> {
    await SecureStore.setItemAsync(BASE_URL_KEY, url.replace(/\/$/, ''));
  },
};
```

**Step 5: Create `mobile/src/services/apiClient.ts`**

```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';

let _client: AxiosInstance | null = null;
let _currentBaseUrl: string = '';

export async function getApiClient(): Promise<AxiosInstance> {
  const baseUrl = await tokenStorage.getBaseUrl();

  // Rebuild client if base URL changed
  if (!_client || _currentBaseUrl !== baseUrl) {
    _currentBaseUrl = baseUrl;
    _client = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Inject session token on every request
    _client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      const token = await tokenStorage.getToken();
      if (token) {
        config.headers['X-Hermes-Session-Token'] = token;
      }
      return config;
    });
  }

  return _client;
}

// Helper: invalidate client when base URL changes
export function invalidateApiClient(): void {
  _client = null;
}
```

**Step 6: Commit**

```bash
cd ~/projects/hermes-mobile
git add mobile/src/
git commit -m "feat: add constants, types, tokenStorage, apiClient"
```

---

## Task 2: ConnectionContext — Server Connection + Auth State

**Objective:** Global context that stores base URL, checks connectivity, holds auth state

**Files:**
- Create: `mobile/src/context/ConnectionContext.tsx`

**Step 1: Create `mobile/src/context/ConnectionContext.tsx`**

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { getApiClient, invalidateApiClient } from '../services/apiClient';
import type { StatusResponse } from '../types';

interface ConnectionState {
  baseUrl: string;
  token: string | null;
  status: StatusResponse | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (baseUrl?: string, token?: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionState | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async (): Promise<StatusResponse | null> => {
    try {
      const client = await getApiClient();
      const res = await client.get<StatusResponse>('/api/status');
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const connect = useCallback(async (newBaseUrl?: string, newToken?: string): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    try {
      if (newBaseUrl) {
        await tokenStorage.setBaseUrl(newBaseUrl);
        setBaseUrl(newBaseUrl);
        invalidateApiClient();
      }
      if (newToken !== undefined) {
        if (newToken) {
          await tokenStorage.setToken(newToken);
        } else {
          await tokenStorage.clearToken();
        }
        setToken(newToken || null);
      }

      const st = await fetchStatus();
      if (st) {
        setStatus(st);
        setIsConnected(true);
        return true;
      } else {
        setError('Cannot reach Hermes. Check base URL and Tailscale connection.');
        setIsConnected(false);
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection failed';
      setError(msg);
      setIsConnected(false);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [fetchStatus]);

  const refresh = useCallback(async () => {
    const st = await fetchStatus();
    if (st) {
      setStatus(st);
      setIsConnected(true);
    }
  }, [fetchStatus]);

  const disconnect = useCallback(async () => {
    await tokenStorage.clearToken();
    setToken(null);
    setIsConnected(false);
    setStatus(null);
  }, []);

  // Restore on mount
  useEffect(() => {
    (async () => {
      const storedUrl = await tokenStorage.getBaseUrl();
      const storedToken = await tokenStorage.getToken();
      setBaseUrl(storedUrl);
      setToken(storedToken);
      await connect(storedUrl, storedToken ?? undefined);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ConnectionContext.Provider
      value={{ baseUrl, token, status, isConnected, isConnecting, error, connect, disconnect, refresh }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection(): ConnectionState {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider');
  return ctx;
}
```

**Step 2: Commit**

```bash
cd ~/projects/hermes-mobile
git add mobile/src/context/
git commit -m "feat: add ConnectionContext for server auth state"
```

---

## Task 3: Navigation Layouts (Root + Drawer)

**Objective:** Wire Expo Router with a drawer navigation that mirrors the dashboard sidebar

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/index.tsx`
- Create: `mobile/app/(main)/_layout.tsx`
- Create: `mobile/app/connect.tsx`
- Create: `mobile/src/components/DrawerContent.tsx`

**Step 1: Create `mobile/app/_layout.tsx` (root layout)**

```tsx
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConnectionProvider } from '../src/context/ConnectionContext';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <ConnectionProvider>
        <Slot />
      </ConnectionProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
```

**Step 2: Create `mobile/app/index.tsx` (entry redirect)**

```tsx
import { Redirect } from 'expo-router';
import { useConnection } from '../src/context/ConnectionContext';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../src/constants';

export default function Index() {
  const { isConnecting, isConnected } = useConnection();

  if (isConnecting) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return isConnected ? <Redirect href="/(main)/system" /> : <Redirect href="/connect" />;
}
```

**Step 3: Create `mobile/src/components/DrawerContent.tsx`**

This is the sidebar — renders all nav items matching the dashboard.

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { COLORS } from '../constants';
import { useConnection } from '../context/ConnectionContext';

interface NavItem {
  label: string;
  route: string;
  icon: string; // emoji as placeholder — swap for lucide-react-native if desired
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Sessions', route: '/(main)/sessions', icon: '💬' },
  { label: 'Files', route: '/(main)/files', icon: '📁' },
  { label: 'Analytics', route: '/(main)/analytics', icon: '📊' },
  { label: 'Models', route: '/(main)/models', icon: '🧠' },
  { label: 'Logs', route: '/(main)/logs', icon: '📋' },
  { label: 'Cron', route: '/(main)/cron', icon: '⏰' },
  { label: 'Skills', route: '/(main)/skills', icon: '📦' },
  { label: 'Plugins', route: '/(main)/plugins', icon: '🧩' },
  { label: 'MCP', route: '/(main)/mcp', icon: '🔌' },
  { label: 'Channels', route: '/(main)/channels', icon: '📡' },
  { label: 'Webhooks', route: '/(main)/webhooks', icon: '🪝' },
  { label: 'Pairing', route: '/(main)/pairing', icon: '🔐' },
  { label: 'Profiles', route: '/(main)/profiles', icon: '👤' },
  { label: 'Config', route: '/(main)/config', icon: '⚙️' },
  { label: 'Keys', route: '/(main)/keys', icon: '🔑' },
  { label: 'System', route: '/(main)/system', icon: '🔧' },
  { label: 'Docs', route: '/(main)/docs', icon: '📖' },
  { label: 'Settings', route: '/(main)/settings', icon: '⚙️' },
];

export function DrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useConnection();

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>HERMES{'\n'}AGENT</Text>
        <Text style={styles.version}>{status?.version ?? '—'}</Text>
      </View>

      {/* Nav items */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.includes(item.route.replace('/(main)/', ''));
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label.toUpperCase()}
              </Text>
              {isActive && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer: gateway status */}
      {status && (
        <View style={styles.footer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: status.gateway_running ? COLORS.success : COLORS.error }
          ]} />
          <Text style={styles.footerText}>
            Gateway {status.gateway_state}
          </Text>
        </View>
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.drawerBg },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brand: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 22,
  },
  version: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'relative',
  },
  navItemActive: { backgroundColor: '#ffffff08' },
  navIcon: { fontSize: 14, marginRight: 12, width: 20, textAlign: 'center' },
  navLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    flex: 1,
  },
  navLabelActive: { color: COLORS.accent },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.accent,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  footerText: { color: COLORS.textSecondary, fontSize: 11 },
});
```

**Step 4: Create `mobile/app/(main)/_layout.tsx`**

```tsx
import { Drawer } from 'expo-router/drawer';
import { DrawerContent } from '../../src/components/DrawerContent';

export default function MainLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#0d0d0d' },
        headerTintColor: '#e0e0e0',
        headerTitleStyle: { fontWeight: '700', letterSpacing: 1 },
        drawerStyle: { backgroundColor: '#0d0d0d', width: 260 },
        sceneContainerStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <Drawer.Screen name="system" options={{ title: 'SYSTEM' }} />
      <Drawer.Screen name="sessions" options={{ title: 'SESSIONS' }} />
      <Drawer.Screen name="files" options={{ title: 'FILES' }} />
      <Drawer.Screen name="analytics" options={{ title: 'ANALYTICS' }} />
      <Drawer.Screen name="models" options={{ title: 'MODELS' }} />
      <Drawer.Screen name="logs" options={{ title: 'LOGS' }} />
      <Drawer.Screen name="cron" options={{ title: 'CRON' }} />
      <Drawer.Screen name="skills" options={{ title: 'SKILLS' }} />
      <Drawer.Screen name="plugins" options={{ title: 'PLUGINS' }} />
      <Drawer.Screen name="mcp" options={{ title: 'MCP' }} />
      <Drawer.Screen name="channels" options={{ title: 'CHANNELS' }} />
      <Drawer.Screen name="webhooks" options={{ title: 'WEBHOOKS' }} />
      <Drawer.Screen name="pairing" options={{ title: 'PAIRING' }} />
      <Drawer.Screen name="profiles" options={{ title: 'PROFILES' }} />
      <Drawer.Screen name="config" options={{ title: 'CONFIG' }} />
      <Drawer.Screen name="keys" options={{ title: 'API KEYS' }} />
      <Drawer.Screen name="docs" options={{ title: 'DOCS' }} />
      <Drawer.Screen name="settings" options={{ title: 'SETTINGS' }} />
    </Drawer>
  );
}
```

**Step 5: Create `mobile/app/connect.tsx`**

Connection/onboarding screen:

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useConnection } from '../src/context/ConnectionContext';
import { COLORS } from '../src/constants';

export default function ConnectScreen() {
  const { connect, error, isConnecting } = useConnection();
  const [baseUrl, setBaseUrl] = useState('http://100.125.69.27:9119');
  const [token, setToken] = useState('');
  const router = useRouter();

  const handleConnect = async () => {
    const ok = await connect(baseUrl.trim(), token.trim() || undefined);
    if (ok) {
      router.replace('/(main)/system');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.brand}>HERMES{'\n'}AGENT</Text>
        <Text style={styles.subtitle}>Connect to your Hermes instance</Text>

        <Text style={styles.label}>BASE URL</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="http://100.125.69.27:9119"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          selectionColor={COLORS.accent}
        />

        <Text style={styles.label}>SESSION TOKEN (optional)</Text>
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          placeholder="Leave blank if auth_required is false"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          selectionColor={COLORS.accent}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color={COLORS.background} size="small" />
          ) : (
            <Text style={styles.buttonText}>CONNECT</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Make sure Tailscale is connected on your device before connecting.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  brand: {
    color: COLORS.accent,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    lineHeight: 38,
    marginBottom: 8,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 40 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  error: { color: COLORS.error, fontSize: 13, marginBottom: 16 },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2,
  },
  hint: { color: COLORS.muted, fontSize: 12, marginTop: 24, textAlign: 'center' },
});
```

**Step 6: Commit**

```bash
cd ~/projects/hermes-mobile
git add mobile/app/ mobile/src/
git commit -m "feat: add drawer navigation and connect screen"
```

---

## Task 4A: System Screen

**Objective:** Dashboard overview — version, gateway status, platform connections, restart/update actions

**Files:**
- Create: `mobile/app/(main)/system.tsx`

```tsx
import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useConnection } from '../../src/context/ConnectionContext';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';

export default function SystemScreen() {
  const { status, refresh, isConnected } = useConnection();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleRestart = async () => {
    Alert.alert('Restart Gateway', 'Restart the Hermes gateway?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restart',
        style: 'destructive',
        onPress: async () => {
          try {
            const client = await getApiClient();
            await client.post('/api/gateway/restart');
            Alert.alert('Restarting', 'Gateway is restarting...');
          } catch (e) {
            Alert.alert('Error', 'Could not restart gateway');
          }
        },
      },
    ]);
  };

  const platforms = status?.gateway_platforms ?? {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
    >
      {/* Status card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>HERMES AGENT</Text>
        <Row label="Version" value={status?.version ?? '—'} />
        <Row label="Release" value={status?.release_date ?? '—'} />
        <Row label="Active Agents" value={String(status?.active_agents ?? 0)} />
        <Row label="Active Sessions" value={String(status?.active_sessions ?? 0)} />
      </View>

      {/* Gateway card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>GATEWAY</Text>
        <Row
          label="State"
          value={status?.gateway_state ?? '—'}
          valueColor={status?.gateway_running ? COLORS.success : COLORS.error}
        />
        <Row label="Busy" value={status?.gateway_busy ? 'Yes' : 'No'} />
      </View>

      {/* Platforms card */}
      {Object.keys(platforms).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PLATFORMS</Text>
          {Object.entries(platforms).map(([name, plat]) => (
            <Row
              key={name}
              label={name.toUpperCase()}
              value={plat.state}
              valueColor={plat.state === 'connected' ? COLORS.success : COLORS.error}
            />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ACTIONS</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={handleRestart}>
          <Text style={styles.actionText}>↻  RESTART GATEWAY</Text>
        </TouchableOpacity>
        {status?.can_update_hermes && (
          <TouchableOpacity style={[styles.actionBtn, { marginTop: 8 }]} onPress={() => Alert.alert('Update', 'Update via terminal: hermes update')}>
            <Text style={styles.actionText}>↓  UPDATE HERMES</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.textSecondary, fontSize: 12, letterSpacing: 1 },
  value: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
  },
  actionText: { color: COLORS.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
});
```

**Commit:**
```bash
git add mobile/app/\(main\)/system.tsx && git commit -m "feat: add System screen"
```

---

## Task 4B: Sessions Screen

**Objective:** List sessions with metadata, tap to view messages, pull to refresh, delete

**Files:**
- Create: `mobile/app/(main)/sessions.tsx`
- Create: `mobile/app/(main)/session-detail.tsx`

**sessions.tsx:** FlatList of sessions from `/api/sessions?limit=25`, pull-to-refresh, swipe to delete (use Alert confirm), tap to navigate to session-detail.

**session-detail.tsx:** FlatList of messages from `/api/sessions/{id}/messages`. Show role (USER/ASSISTANT/TOOL) with color coding.

---

## Task 4C: Logs Screen

**Objective:** Live log tail from `/api/logs`, filter by level, auto-refresh every 3s

**Files:**
- Create: `mobile/app/(main)/logs.tsx`

FlatList of log entries, level badge colors (DEBUG=muted, INFO=accent, WARNING=warning, ERROR=error, CRITICAL=error+bold), level filter buttons at top, auto-refresh using `useInterval`.

---

## Task 4D: Cron Screen

**Objective:** List cron jobs, pause/resume/trigger/delete each

**Files:**
- Create: `mobile/app/(main)/cron.tsx`

FlatList of CronJob from `/api/cron/jobs?profile=default`. Each card: name/ID, schedule, last_run, last_status badge, action buttons (pause/resume/trigger/delete).

---

## Task 4E: Models Screen

**Objective:** Show current model, list all available models, allow switching

**Files:**
- Create: `mobile/app/(main)/models.tsx`

Show current model info card from `/api/model/info`. Below it, list model options from `/api/model/options` grouped by provider. Tap any model to switch via `POST /api/model/set`.

---

## Task 4F: Skills Screen

**Objective:** List all skills with category, description, enabled toggle

**Files:**
- Create: `mobile/app/(main)/skills.tsx`

FlatList from `/api/skills`. Each item: name, description, category badge, Toggle via `POST /api/skills/toggle`.

---

## Task 4G: Keys Screen (API Keys / Env)

**Objective:** Show all env vars, which are set vs unset, reveal values on tap

**Files:**
- Create: `mobile/app/(main)/keys.tsx`

List all env vars from `/api/env`. Each row: key name, `SET`/`UNSET` badge, masked_value. Tap "Reveal" to call `/api/env/reveal` and show the value. Add a "Set new value" option via Alert.prompt.

---

## Task 4H: Config Screen

**Objective:** View and edit the raw YAML config

**Files:**
- Create: `mobile/app/(main)/config.tsx`

Fetch raw YAML from `/api/config/raw`. Display in a monospace ScrollView. Edit button opens a TextInput for the full YAML. Save via `POST /api/config/raw`.

---

## Task 4I: Analytics Screen

**Objective:** Display token usage and cost stats

**Files:**
- Create: `mobile/app/(main)/analytics.tsx`

Cards showing: sessions, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, estimated_cost_usd, api_calls, tool_calls. Period selector (7/30/90 days) passed as `?days=N`.

---

## Task 4J: Channels Screen

**Objective:** Show all messaging platform connection states

**Files:**
- Create: `mobile/app/(main)/channels.tsx`

List platforms from `/api/messaging/platforms`. Each row: platform name, state badge (connected=green, error=red), error message if present.

---

## Task 4K: Profiles Screen

**Objective:** List profiles, show active, switch profiles

**Files:**
- Create: `mobile/app/(main)/profiles.tsx`

List from `/api/profiles`. Active profile highlighted. Tap to switch via `POST /api/profiles/active`.

---

## Task 4L: Files Screen

**Objective:** Browse the Hermes file system

**Files:**
- Create: `mobile/app/(main)/files.tsx`

Breadcrumb navigation, list files/dirs from `/api/files?path=<path>`. Tap dir to navigate in. Tap file to view contents (text files). Directory entries show folder icon, files show file icon and size.

---

## Task 4M: MCP Screen

**Objective:** Show MCP servers and their tool counts/status

**Files:**
- Create: `mobile/app/(main)/mcp.tsx`

List from `/api/mcp`. Each server: name, status badge, tools_count, error message if any.

---

## Task 4N: Plugins Screen

**Objective:** List installed plugins

**Files:**
- Create: `mobile/app/(main)/plugins.tsx`

List from `/api/dashboard/plugins` or `/api/plugins`. Each item: name, description, enabled status.

---

## Task 4O: Webhooks Screen

**Objective:** List configured webhooks

**Files:**
- Create: `mobile/app/(main)/webhooks.tsx`

List from `/api/webhooks`. Each webhook: name/URL, events, enabled toggle.

---

## Task 4P: Pairing Screen

**Objective:** Show pairing info for connecting new devices

**Files:**
- Create: `mobile/app/(main)/pairing.tsx`

Fetch from `/api/pairing`. Show pairing code or QR code (use `expo-qrcode` or display the URL for manual entry).

---

## Task 4Q: Docs Screen

**Objective:** WebView browser pointing at Hermes docs

**Files:**
- Create: `mobile/app/(main)/docs.tsx`

`WebView` pointing at `https://claude-code.nousresearch.com/docs`. Back/forward navigation buttons. Loading indicator.

---

## Task 4R: Settings Screen

**Objective:** Configure base URL and session token

**Files:**
- Create: `mobile/app/(main)/settings.tsx`

Form with base URL field and session token field (secureTextEntry). Save button calls `connect()` from ConnectionContext with new values. Shows current connection status. "Disconnect" button clears token and goes to connect screen.

---

## Task 5: Final Wiring + GitHub Push

**Objective:** Verify all imports resolve, screens render, clean up, final push

**Steps:**

1. Run `npx expo export --platform android --dev` to verify no TypeScript errors
2. Verify all `app/(main)/*.tsx` files exist
3. Verify `app/_layout.tsx`, `app/index.tsx`, `app/connect.tsx` exist
4. Create `AGENTS.md` at root with Expo SDK 56 note
5. Final commit and push:

```bash
cd ~/projects/hermes-mobile
git add .
git commit -m "feat: complete Hermes Mobile — all 18 screens"
git push origin main
```

---

## Notes for Subagents

- **Never hardcode** the base URL — always use `tokenStorage.getBaseUrl()`
- **Bash escaping**: `app/(main)/` directories → use `mobile/app/\(main\)/` in bash commands or quote the path
- **Dynamic routes**: `[id].tsx` → quote in git add: `git add "mobile/app/(main)/sessions/[id].tsx"`
- **Parallel screen tasks** (4A–4R): each screen is an independent file, safe to parallelize in batches of 3
- **Color**: Every screen uses `COLORS` from `../../src/constants` — never inline hex colors
- **Loading state**: Every data-fetching screen shows `ActivityIndicator` while loading
- **Error state**: Every data-fetching screen shows an error message with a retry button
- **Pull to refresh**: Every list screen implements `RefreshControl`
- **Focus refresh**: Use `useFocusEffect` + `useCallback` for refetching when navigating back to a screen
