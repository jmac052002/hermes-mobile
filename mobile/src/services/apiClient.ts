import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';

let _client: AxiosInstance | null = null;
let _currentBaseUrl: string = '';

export async function getApiClient(): Promise<AxiosInstance> {
  const baseUrl = await tokenStorage.getBaseUrl();

  if (!_client || _currentBaseUrl !== baseUrl) {
    _currentBaseUrl = baseUrl;
    _client = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

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

export function invalidateApiClient(): void {
  _client = null;
}
