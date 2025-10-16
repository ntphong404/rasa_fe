import { User, UserQuery } from "@/features/users/api/dto/User";
import { userService } from "@/features/users/api/service";
import { useState } from "react";

export const useUser = () => {
    //get all users
    const [users, setUsers] = useState<User[] | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorUser, setErrorUser] = useState<string | null>(null);

    const getAllUsers = async (params?: UserQuery) => {
        setLoading(true)
        try {
            const data = await userService.getAllUsers(params);
            setUsers(data);
            return data;
        } catch (error) {
            setErrorUser("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const banUser = async (id: string) => {
        setLoading(true);
        try {
            const data = await userService.banUser(id);
            setUser(data);
        } catch (error) {
            setErrorUser("Không thể chặn người dùng");
        } finally {
            setLoading(false);
        }
    };

    const unbanUser = async (id: string) => {
        setLoading(true);
        try {
            await userService.unbanUser(id);
        } catch (error) {
            setErrorUser("Không thể khôi phục người dùng")
        } finally {
            setLoading(false);
        }
    }

    return {
        users,
        user,
        loading,
        errorUser,
        getAllUsers,
        banUser,
        unbanUser
    };
};
