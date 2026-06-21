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
