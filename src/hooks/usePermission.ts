import { PermissionCreateRequest } from "@/features/permissions/api/dto/PermissionCreateRequest";
import { ListPermissionResponse } from "@/features/permissions/api/dto/permissions.dto";
import { permissionsService } from "@/features/permissions/api/service";
import { useState } from "react";

export const usePermission = () => {
    const [permissions, setPermissions] = useState<ListPermissionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPermissions = async (query: string) : Promise<ListPermissionResponse> => {
        try {
            const data = await permissionsService.fetchPermissions(query);
            setPermissions(data);
            setIsLoading(false);
            return data;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch permissions";
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const deletePermission = async (id: string): Promise<void> => {
        try {
            await permissionsService.deletePermission(id);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete permission";
            setError(message);
            throw new Error(message);
        }
    };

    const createPermission = async (data: PermissionCreateRequest): Promise<void> => {
        try {
            await permissionsService.createPermission(data);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create permission";
            setError(message);
            throw new Error(message);
        }
    };

    const updatePermission = async (id: string, data: Partial<PermissionCreateRequest>): Promise<void> => {
        try {
            await permissionsService.updatePermission(id, data);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update permission";
            setError(message);
            throw new Error(message);
        }
    };

    return { permissions, isLoading, error, fetchPermissions, deletePermission, createPermission, updatePermission };
}