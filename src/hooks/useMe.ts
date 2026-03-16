
import { UpdateMeRequest } from "@/features/auth/api/dto/UpdateMeRequest";
import { authService } from "@/features/auth/api/service";
import { useAuthStore } from "@/store/auth";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export const useMe = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const updateUser = useAuthStore((state) => state.updateUser);
    const user = useAuthStore((state) => state.user);

    // Lấy thông tin user hiện tại
    const getMe = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authService.getMe();
            updateUser(response);
            return response;
        }
        catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Lấy thông tin người dùng thất bại."
            );
            throw err; // Re-throw the error for further handling if needed
        }
        finally {
            setIsLoading(false);
        }
    }, [updateUser]);

    const updateMe = useCallback(async (data: UpdateMeRequest) => {
        setIsLoading(true);
        try {
            const response = await authService.updateMe(data);
            toast.success("Cập nhật thông tin thành công");
            updateUser(response);
            return response;
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Cập nhật thông tin người dùng thất bại."
            );
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [updateUser]);

    return { isLoading, error, user, getMe, updateMe };
}


