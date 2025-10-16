import { CreateRoleRequest } from "@/features/roles/api/dto/CreateRoleRequest";
import { ListRoleResponse, Role } from "@/features/roles/api/dto/RoleResponse";
import { UpdateRoleRequest } from "@/features/roles/api/dto/UpdateRoleRequest";
import { rolesService } from "@/features/roles/api/service";
import { IRole } from "@/interfaces/role.interface";
import { useState } from "react";

export const useRole = () => {
    const [roles, setRoles] = useState<ListRoleResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorRole, setErrorRole] = useState<string | null>(null);


        const fetchRoles = async (query: string) : Promise<ListRoleResponse> => {
            try {
                const data = await rolesService.fetchRoles(query);
                setRoles(data);
                setLoading(false);
                return data;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to fetch roles";
                setErrorRole(message);
                throw new Error(message);
            } finally {
                setLoading(false);
            }
        };

        const updateRole = async (id: string, data: UpdateRoleRequest) => {
            try {
                 await rolesService.updateRole(id, data);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to update role";
                setErrorRole(message);
                throw new Error(message);
            }
        };

        const createRole = async (data: CreateRoleRequest) => {
            try {
                    await rolesService.createRole(data);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to create role";
                setErrorRole(message);
                throw new Error(message);
            }

        }

        const deleteRole = async (id: string) => {
            try {
                await rolesService.deleteRole(id);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to delete role";
                setErrorRole(message);
                throw new Error(message);
            }
        };

        const getRoleById = async (id: string): Promise<Role | null> => {
            try{
                const data = await rolesService.getRoleById(id);
                return data;
            }
            catch(error){
                const message = error instanceof Error ? error.message : "Failed to get role";
                setErrorRole(message);
                throw new Error(message);
            }
        }




    return { roles, loading, errorRole, fetchRoles, updateRole,createRole, deleteRole,getRoleById };
};
