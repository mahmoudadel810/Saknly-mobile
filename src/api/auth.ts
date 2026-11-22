import { api, authHeader } from './client';
import type {
  ApiMessage,
  GetMeResponse,
  LoginInput,
  RegisterInput,
  RegisterResponse,
  ResetPasswordInput,
  TokenResponse,
  User,
} from './types';

const AUTH = '/auth';

export const authApi = {
  register: async (input: RegisterInput) =>
    (await api.post<RegisterResponse>(`${AUTH}/register`, input)).data,

  resendConfirmation: async (email: string) =>
    (await api.post<ApiMessage>(`${AUTH}/resend-confirmation`, { email })).data,

  login: async (input: LoginInput) => (await api.post<TokenResponse>(`${AUTH}/login`, input)).data,

  /** Pass a token to check one that isn't the client's current token yet. */
  getMe: async (token?: string): Promise<User> => {
    const headers = token ? authHeader(token) : undefined;
    return (await api.get<GetMeResponse>(`${AUTH}/getMe`, { headers })).data.data.user;
  },

  /** Swaps a still-valid token for a new one. An expired token can't be refreshed. */
  refreshToken: async (token: string) =>
    (await api.post<TokenResponse>(`${AUTH}/refresh-token`, null, { headers: authHeader(token) }))
      .data,

  logout: async (token: string) =>
    (await api.post<ApiMessage>(`${AUTH}/logout`, null, { headers: authHeader(token) })).data,

  forgotPassword: async (email: string) =>
    (await api.post<ApiMessage>(`${AUTH}/forgot-password`, { email })).data,

  resetPassword: async (input: ResetPasswordInput) =>
    (await api.post<ApiMessage>(`${AUTH}/reset-password`, input)).data,
};
