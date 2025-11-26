import axiosInstance from "@/api/axios";
import { LoginRequest, LoginResponse } from "./dto/login.dto";
import ENDPOINTS from "@/api/endpoints";
import { RegisterRequest } from "./dto/RegisterRequest";
import { RegisterResponse } from "./dto/RegisterResponse";
import { MeResponse } from "./dto/MeResponse";
import { IUser } from "@/interfaces/user.interface";
import { UpdateMeRequest } from "./dto/UpdateMeRequest";
import { ForgotPasswordRequest } from "./dto/ForgotPasswordRequest";
import { ForgotPasswordResponse } from "./dto/ForgotPasswordResponse";
import { ResetPasswordRequest } from "./dto/ResetPasswordRequest";
import { ResetPasswordResponse } from "./dto/ResetPasswordResponse";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post(ENDPOINTS.AUTH_ENDPOINTS.LOGIN, data);
    // Response may contain tokens under data.data or data
    const payload = response.data?.data ?? response.data;
    const access = payload?.accessToken ?? payload?.access_token ?? null;
    const refresh = payload?.refreshToken ?? payload?.refresh_token ?? null;
    if (access) localStorage.setItem('authToken', access);
    if (refresh) localStorage.setItem('refreshToken', refresh);
    return payload;
  },
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await axiosInstance.post(ENDPOINTS.AUTH_ENDPOINTS.REGISTER, data);
    const payload = response.data?.data ?? response.data;
    const access = payload?.accessToken ?? payload?.access_token ?? null;
    const refresh = payload?.refreshToken ?? payload?.refresh_token ?? null;
    if (access) localStorage.setItem('authToken', access);
    if (refresh) localStorage.setItem('refreshToken', refresh);
    return payload;
  },
  verify: async (otp: string): Promise<any> => {
    const payload = { otp };
    const response = await axiosInstance.post(ENDPOINTS.AUTH_ENDPOINTS.VERIFY, payload);
    return response.data;
  },
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await axiosInstance.post(ENDPOINTS.AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
    const payload = response.data?.data ?? response.data;
    // Lưu pre-access token để dùng cho verify-reset-otp và reset-password
    if (payload?.accessToken) {
      localStorage.setItem('authToken', payload.accessToken);
    }
    return payload;
  },
  verifyResetOtp: async (otp: string): Promise<{ success: boolean; message?: string }> => {
    const response = await axiosInstance.post(ENDPOINTS.AUTH_ENDPOINTS.VERIFY_RESET_OTP, { otp });
    return response.data?.data ?? response.data;
  },
  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const response = await axiosInstance.post(ENDPOINTS.AUTH_ENDPOINTS.RESET_PASSWORD, data);
    return response.data?.data ?? response.data;
  },
  getMe: async (): Promise<IUser> => {
    const response = await axiosInstance.get(ENDPOINTS.AUTH_ENDPOINTS.ME);
    return response.data.data;
  },
  updateMe: async (data: UpdateMeRequest): Promise<IUser> => {
    const response = await axiosInstance.put(ENDPOINTS.AUTH_ENDPOINTS.UPDATE_ME, data);
    return response.data.data;
  }
}