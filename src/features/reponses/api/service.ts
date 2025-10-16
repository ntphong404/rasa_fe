import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { ListMyResponseResult } from "./dto/MyResponseResult";
import { CreateMyReponseRequest } from "./dto/CreateMyReponse";
import { IMyResponse } from "@/interfaces/response.interface";


export const responseService = {
  fetchResponses: async (query: string): Promise<ListMyResponseResult> => {
    const response = await axiosInstance.get(`${ENDPOINTS.RESPONSE_ENDPOINTS.GET_ALL_PAGINATED}?${query}`);
    return response.data;
  },
  createResponse: async (data: CreateMyReponseRequest) : Promise<IMyResponse> => {
    const response = await axiosInstance.post(ENDPOINTS.RESPONSE_ENDPOINTS.CREATE, data);
    return response.data.data;
  },
  getResponseById: async (id: string) : Promise<IMyResponse> => {
    const response = await axiosInstance.get(ENDPOINTS.RESPONSE_ENDPOINTS.GET_BY_ID(id));
    return response.data.data;
  },
  updateResponse: async (id: string, data: IMyResponse) : Promise<IMyResponse> => {
    const response = await axiosInstance.put(ENDPOINTS.RESPONSE_ENDPOINTS.UPDATE(id), data);
    return response.data.data;
  },
  hardDeleteResponse: async (id: string) : Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.RESPONSE_ENDPOINTS.HARD_DELETE(id));
  },
  softDeleteResponse: async (id: string) : Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.RESPONSE_ENDPOINTS.SOFT_DELETE(id));
  },
  restoreResponse: async (id: string) : Promise<void> => {
    await axiosInstance.patch(ENDPOINTS.RESPONSE_ENDPOINTS.RESTORE(id));
  }
}