import { ISlot } from "@/interfaces/slot.interface";

export interface ListSlotResponse {
  success: boolean;
  data: ISlot[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}