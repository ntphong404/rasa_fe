export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  clientId?: string;
  isPreAcesss: boolean,
  preAccessType?: string;
}