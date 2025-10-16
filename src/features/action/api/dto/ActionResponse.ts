import { IAction } from "@/interfaces/action.interface";

export interface ListActionResponse {
    success: boolean;
    data: IAction[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}