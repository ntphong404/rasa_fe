export interface CreateSlotRequest {
  name: string;
  description?: string;
  define: string;
  botIds: string[];
  entity?: string | null;
  intent?: string | null;
  action?: string | null;
  roles: string[];
}

export interface UpdateSlotRequest extends CreateSlotRequest {
  _id: string;
}