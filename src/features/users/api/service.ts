import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { User, UserQuery } from "./dto/User";

export const userService = {

    getAllUsers: async (params?: UserQuery) => {
        const response = await axiosInstance.get(
            ENDPOINTS.USER_ENDPOINTS.GET_ALL_USERS,
            { params }
        );
        return response.data;
    },

    // getAllUsers: async (params?: {
    //     page?: number;
    //     limit?: number;
    //     search?: string;
    //     deleted?: boolean;
    //     sort?: "ASC" | "DESC";
    //     status?: string | string[];
    // }): Promise<User[]> => {

    //         const formattedParams = Array.isArray(params?.status)
    //         ? { ...params, "status[$in]": params.status, status: undefined }
    //         : params;

    //     const response = await axiosInstance.get(
    //         ENDPOINTS.USER_ENDPOINTS.GET_ALL_USERS,
    //         { params: formattedParams }
    //     );
    //     return response.data.data;
    // },
    
    banUser: async (id: string) => {
        const response = await axiosInstance.post(ENDPOINTS.USER_ENDPOINTS.BAN_USER(id))
        return response.data.data
    },

    unbanUser: async (id: string) => {
        const response = await axiosInstance.post(ENDPOINTS.USER_ENDPOINTS.UNBAN_USER(id));

        return response.data.data;
    }

};
