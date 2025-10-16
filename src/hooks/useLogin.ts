import { authService } from "@/features/auth/api/service";
import { useState } from "react";

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const login = async (data: { email: string; password: string }) => {
        setLoading(true);
        setError(null);
        try {
            await authService.login(data);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Login failed. Please check your credentials."
            );
            throw err; // Re-throw the error for further handling if needed
        }
        finally {
            setLoading(false);
        }
    }

    return { loading, error, login };
}