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

    createUser: async (data: {
        email: string;
        firstName: string;
        lastName: string;
        password?: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        gender?: string;
        address?: string;
        roleIds?: string[];
    }) => {
        const response = await axiosInstance.post(
            ENDPOINTS.USER_ENDPOINTS.CREATE_USER,
            data
        );
        return response.data.data;
    },

    createBulkUsers: async (data: {
        users: Array<{
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber?: string;
            dateOfBirth?: string;
            gender?: string;
            address?: string;
        }>;
    }) => {
        const response = await axiosInstance.post(
            ENDPOINTS.USER_ENDPOINTS.CREATE_BULK_USERS,
            data
        );
        return response.data.data;
    },
    
    banUser: async (id: string) => {
        const response = await axiosInstance.post(ENDPOINTS.USER_ENDPOINTS.BAN_USER(id))
        return response.data.data
    },

    unbanUser: async (id: string) => {
        const response = await axiosInstance.post(ENDPOINTS.USER_ENDPOINTS.UNBAN_USER(id));
        return response.data.data;
    },

    deleteUser: async (id: string) => {
        const response = await axiosInstance.delete(
            ENDPOINTS.USER_ENDPOINTS.DELETE_USER(id)
        );
        return response.data.data;
    },

    setRole: async (id: string, roleId: string) => {
        const response = await axiosInstance.patch(
            ENDPOINTS.USER_ENDPOINTS.SET_ROLE(id),
            { roleId }
        );
        return response.data.data;
    }
};
