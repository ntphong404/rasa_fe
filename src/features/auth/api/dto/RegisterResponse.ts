export interface RegisterResponse {
 success: boolean;
 data: {
    accessToken: string;
    refreshToken: string;
    clientId: string | null;
    isPreAccess: boolean;
    preAccessType: string | null;
 }
    message: string;
}