import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { ISlot } from "@/interfaces/slot.interface";
import createSlotQuery, { SlotQuery } from "./dto/SlotQuery";
import { CreateSlotRequest, UpdateSlotRequest } from "./dto/SlotRequest";
import { ListSlotResponse } from "./dto/SlotResponse";

export const slotService = {
  fetchSlots: async (query: SlotQuery): Promise<ListSlotResponse> => {
    const response = await axiosInstance.get(
      `${ENDPOINTS.SLOT_ENDPOINTS.GET_ALL_PAGINATED}?${createSlotQuery(query)}`
    );
    return response.data;
  },
  createSlot: async (data: CreateSlotRequest): Promise<ISlot> => {
    const response = await axiosInstance.post(ENDPOINTS.SLOT_ENDPOINTS.CREATE, data);
    return response.data.data;
  },
  getSlotById: async (id: string): Promise<ISlot> => {
    const response = await axiosInstance.get(ENDPOINTS.SLOT_ENDPOINTS.GET_BY_ID(id));
    return response.data.data;
  },
  updateSlot: async (id: string, data: UpdateSlotRequest): Promise<ISlot> => {
    const response = await axiosInstance.put(ENDPOINTS.SLOT_ENDPOINTS.UPDATE(id), data);
    return response.data.data;
  },
  hardDeleteSlot: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.SLOT_ENDPOINTS.HARD_DELETE(id));
  },
  softDeleteSlot: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.SLOT_ENDPOINTS.SOFT_DELETE(id));
  },
  restoreSlot: async (id: string): Promise<void> => {
    await axiosInstance.patch(ENDPOINTS.SLOT_ENDPOINTS.RESTORE(id));
  },
};