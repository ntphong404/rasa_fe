export interface MyResponseResult {
    _id: string;
    name: string;
    description: string;
    define: string;
    roles: string[];
    deleted: boolean;
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ListMyResponseResult {
    success: boolean;
    data: MyResponseResult[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}