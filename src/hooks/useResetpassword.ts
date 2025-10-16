import { useState } from "react";
import axios from "axios";
import { authService } from "@/features/auth/api/service";
import { ResetPasswordRequest } from "@/features/auth/api/dto/ResetPasswordRequest";
import { ResetPasswordResponse } from "@/features/auth/api/dto/ResetPasswordResponse";

export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResetPasswordResponse | null>(null);
  const [success, setSuccess] = useState(false);

  const resetPassword = async (payload: ResetPasswordRequest) => {
    setLoading(true);
    setError(null);
    setData(null);
    setSuccess(false);

    try {
      const res = await authService.resetPassword(payload);
      setData(res);
      setSuccess(true);
      return res;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message ||
          "Đặt lại mật khẩu thất bại! Vui lòng thử lại.";
        setError(message);
      } else {
        setError("Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { resetPassword, loading, error, success, data };
}