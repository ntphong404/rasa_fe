import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { ListRoleResponse, Role } from "./dto/RoleResponse";
import { UpdateRoleRequest } from "./dto/UpdateRoleRequest";
import { CreateRoleRequest } from "./dto/CreateRoleRequest";


export const rolesService = {
    fetchRoles: async (query: string): Promise<ListRoleResponse> => {
        const response = await axiosInstance.get(`${ENDPOINTS.ROLE_ENDPOINTS.GET_ALL_PAGINATED}${query}`);
        return response.data;
    },
    updateRole: async (id : string,data: UpdateRoleRequest) : Promise<Role> => {
        const response = await axiosInstance.put(`${ENDPOINTS.ROLE_ENDPOINTS.UPDATE_ROLE}/${id}`, data);
        return response.data;
    },
    createRole: async (data: CreateRoleRequest) : Promise<Role> => {
        const response = await axiosInstance.post(ENDPOINTS.ROLE_ENDPOINTS.CREATE_ROLE, data);
        return response.data;
    },
    deleteRole: async (id: string) : Promise<void> => {
        await axiosInstance.delete(ENDPOINTS.ROLE_ENDPOINTS.DELETE_ROLE(id)); 
    },
    getRoleById: async (id: string) : Promise<Role> => {
        const response = await axiosInstance.get(`${ENDPOINTS.ROLE_ENDPOINTS.GET_ROLE_BY_ID}/${id}`);
        return response.data.data;
    }

}