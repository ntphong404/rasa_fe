export interface ISlot {
  _id: string;
  name: string;
  description?: string;
  type: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
}