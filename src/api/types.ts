// Response shapes of the Saknly API (/api/saknly/v1), taken from Saknly-server controllers.

export type Role = 'user' | 'admin';

/** The short user object returned by login and refresh-token. */
export interface SessionUser {
  _id: string;
  userName: string;
  email: string;
  role: Role;
}

/** The full user document returned by getMe. */
export interface User extends SessionUser {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  isConfirmed: boolean;
  status: 'active' | 'in-active';
  provider: 'local' | 'google';
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiMessage {
  success: boolean;
  message: string;
}

export interface TokenResponse extends ApiMessage {
  token: string;
  user: SessionUser;
}

export interface RegisterResponse extends ApiMessage {
  emailSent: boolean;
  data: Pick<SessionUser, '_id' | 'userName' | 'email'>;
}

export interface GetMeResponse extends ApiMessage {
  data: { user: User };
}

export interface RegisterInput {
  userName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
  confirmNewPassword: string;
}
