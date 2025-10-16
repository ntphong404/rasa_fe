export interface Permission {
    _id: string;
    description: string;
    originalUrl: string;
    method: string;
    module: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ListPermissionResponse {
    success: boolean;
    data: Permission[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}