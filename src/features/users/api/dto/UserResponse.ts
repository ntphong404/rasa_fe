import { IUser } from "@/interfaces/user.interface";


export interface UserResponse {
    success: boolean;
    data: IUser[];
    message: string;
    meta : {
        page: number;
        total: number;
        limit: number;
        totalPages: number;
    }

}