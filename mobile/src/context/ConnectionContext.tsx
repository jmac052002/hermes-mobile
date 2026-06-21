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
