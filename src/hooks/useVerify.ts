import { authService } from "@/features/auth/api/service";
import { useState } from "react";

export const useVerify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async (otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verify(otp);
      return response;
    } catch (err) {
      setError("Verification failed");
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { verify, isLoading, error };
};
