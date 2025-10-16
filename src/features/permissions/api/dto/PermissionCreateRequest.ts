export interface PermissionCreateRequest {
    description?: string;
    originalUrl: string;
    method: string;
    module: string;
    isPublic: boolean;
}