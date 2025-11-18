import { authService } from "@/features/auth/api/service";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const login = async (data: { email: string; password: string }) => {
        setLoading(true);
        setError(null);
        try {
            const payload = await authService.login(data);

            // payload contains `clientId` per backend JSON
            const clientId = payload?.clientId ?? null;

            // mark authenticated and save clientId in zustand
            if (clientId) {
                useAuthStore.getState().setAuth(true, clientId);
            } else {
                // still mark as authenticated (clientId may be provided later)
                useAuthStore.getState().setAuth(true, null);
            }

            return payload;
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