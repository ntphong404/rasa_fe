import { IRole } from "./role.interface";

export interface IChatbot {
  _id: string;
  botId: string; // Custom bot ID (e.g., "pccc_namdinh")
  name: string;
  ip: string;
  rasaPort: number;
  flaskPort: number;
  roles: IRole[] | string[];
  
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  deletedAt?: Date;
  
  createdBy?: string;
  updatedBy?: string;
}