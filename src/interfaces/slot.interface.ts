export interface ISlot {
  _id: string;
  name: string;
  description?: string;
  define: string;
  botIds: string[];
  entity?: string | null;
  intent?: string | null;
  action?: string | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}