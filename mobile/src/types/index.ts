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

export interface SkillInfo {
  name: string;
  description: string;
  enabled: boolean;
  category: string | null;
  tags: string[];
}

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  logger: string;
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number | null;
  modified: number | null;
}

export interface EnvVarInfo {
  set: boolean;
  masked_value: string | null;
  description: string | null;
}

export interface ProfileInfo {
  name: string;
  description: string | null;
  is_active: boolean;
  model: string | null;
  provider: string | null;
}

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

export interface McpServer {
  name: string;
  status: 'connected' | 'error' | 'disabled';
  tools_count: number;
  error?: string;
}

export interface ChannelPlatform {
  name: string;
  state: 'connected' | 'disconnected' | 'error';
  display_name: string;
  error_message: string | null;
}
