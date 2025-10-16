export interface Role {
    _id: string;
    name: string;
    description: string;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ListRoleResponse {
    success: boolean;
    data: Role[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}