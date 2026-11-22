import { type AxiosError, create, isAxiosError } from 'axios';

import { env } from '@/config/env';

/**
 * The one HTTP client for the Saknly API. The server expects exactly
 * `Authorization: Saknly__<jwt>` (no space, no "Bearer"); the prefix comes from env.
 * No default Content-Type: axios picks JSON for objects and multipart for FormData.
 */
export const api = create({ baseURL: env.apiUrl, timeout: 20_000 });

let currentToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** The session token the client attaches to requests. Set by the AuthProvider. */
export const setApiToken = (token: string | null) => {
  currentToken = token;
};

/** Called when a protected request answers 401, meaning the session is no longer valid. */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

export const authHeader = (token: string | null = currentToken): Record<string, string> =>
  token ? { Authorization: `${env.tokenPrefix}${token}` } : {};

api.interceptors.request.use((config) => {
  if (!config.headers.Authorization && currentToken) {
    config.headers.Authorization = `${env.tokenPrefix}${currentToken}`;
  }
  return config;
});

// Auth endpoints answer 401 for wrong credentials or a stale token; their callers handle it.
const isAuthEndpoint = (url?: string) => !!url && url.includes('/auth/');

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      !isAuthEndpoint(error.config?.url)
    ) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** The server's error message (`{ success: false, message }`), or a fallback. */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const message = (error as AxiosError<{ message?: string }>).response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.replace(/^Validation failed:\s*/, '');
    }
  }
  return fallback;
};

/** Query retry policy: retry once on no answer or a 5xx; a 4xx won't change on retry. */
export const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 1) return false;
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === undefined || status >= 500;
};

/** True when the request never got an answer (no network, server down, timeout). */
export const isNetworkError = (error: unknown): boolean => isAxiosError(error) && !error.response;
