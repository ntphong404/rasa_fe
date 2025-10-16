export interface ForgotPasswordResponse {
  accessToken: string
  refreshToken: string | null
  clientId: string | null
  preAccessType: string
  isPreAcesss: boolean
  message?: string
}