import {IRole} from "@/interfaces/role.interface";
export interface MeResponse {
  data: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    address: string;
    phoneNumber: string;
    avatar: string;
    roles: IRole[];
    is2FAEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  },
}