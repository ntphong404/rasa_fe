import { IEntity } from "@/interfaces/entity.interface";

export interface ListEnityResponse {
    success: boolean;
    data: IEntity[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}