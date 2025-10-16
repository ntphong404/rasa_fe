import { useState } from "react";
import axios from "axios";
import { authService } from "@/features/auth/api/service";
import { ForgotPasswordRequest } from "@/features/auth/api/dto/ForgotPasswordRequest";
import { ForgotPasswordResponse } from "@/features/auth/api/dto/ForgotPasswordResponse";

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ForgotPasswordResponse | null>(null);
  const [success, setSuccess] = useState(false)

  const forgotPassword = async (payload: ForgotPasswordRequest) => {
    setLoading(true);
    setError(null);
    setData(null);
    setSuccess(false);

    try {
      const res = await authService.forgotPassword(payload);
      setData(res);
      setSuccess(true);

      return res;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message || "Gửi mã OTP thất bại! Vui lòng thử lại.";
        setError(message);
      } else {
        setError("Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    forgotPassword,
    data,
    loading,
    error,
    success,
  }
}