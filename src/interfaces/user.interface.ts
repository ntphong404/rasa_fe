import { Role } from "@/features/roles/api/dto/RoleResponse";
import { IRole } from "./role.interface";

export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  phoneNumber: string;
  avatar: string;
  is2FAEnabled: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}