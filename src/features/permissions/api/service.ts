import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { ListPermissionResponse, Permission } from "./dto/permissions.dto";
import { PermissionCreateRequest } from "./dto/PermissionCreateRequest";

export const permissionsService = {
    fetchPermissions: async (query: string): Promise<ListPermissionResponse> => {
        const normalizedQuery = query.startsWith("?") ? query.slice(1) : query;
        const url = normalizedQuery
            ? `${ENDPOINTS.PERMISSION_ENDPOINTS.GET_ALL_PAGINATED}?${normalizedQuery}`
            : ENDPOINTS.PERMISSION_ENDPOINTS.GET_ALL_PAGINATED;
        const response = await axiosInstance.get(url);
        return response.data;
    },
    deletePermission: async (id: string): Promise<void> => {
        await axiosInstance.delete(ENDPOINTS.PERMISSION_ENDPOINTS.DELETE_PERMISSION(id));
    },
    createPermission: async (data: PermissionCreateRequest): Promise<Permission> => {
        const response = await axiosInstance.post(ENDPOINTS.PERMISSION_ENDPOINTS.CREATE_PERMISSION, data);
        return response.data;
    },
    updatePermission: async (id: string, data: Partial<PermissionCreateRequest>): Promise<Permission> => {
        const response = await axiosInstance.put(`${ENDPOINTS.PERMISSION_ENDPOINTS.UPDATE_PERMISSION}/${id}`, data);
        return response.data;
    }
}