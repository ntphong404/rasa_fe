import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { IntentDetailResponse, ListIntentResponse, CreateFullResponse } from "./dto/IntentResponse";
import { CreateIntentRequest } from "./dto/CreateIntentRequest";
import { IIntent } from "@/interfaces/intent.interface";
import createIntentQuery, { IntentQuery } from "./dto/IntentQuery";
import { IEntity } from "@/interfaces/entity.interface";
import createEntityQuery from "@/features/entity/api/dto/EnityQuery";
import { GeminiExampleResponse } from "./dto/GeminiExampleResponse";
import { IGeminiExampleRequest } from "./dto/GeminiExampleRequest";

export interface CreateFullRequest {
  name: string
  description?: string
  examples: string[]
  answer?: string
  define?: string
  actionName?: string
  botIds: string[]
  label?: string
  entities?: string[]
  source?: 'gmail' | 'facebook' | 'excel' | 'manual'
}

export const intentService = {
    fetchIntents: async (query: IntentQuery): Promise<ListIntentResponse> => {
        const response = await axiosInstance.get(`${ENDPOINTS.INTENT_ENDPOINTS.GET_ALL_PAGINATED}?${createIntentQuery(query)}`);
        return response.data;
    },
    createIntent: async (data: CreateIntentRequest): Promise<IIntent> => {
        const response = await axiosInstance.post(ENDPOINTS.INTENT_ENDPOINTS.CREATE, data);
        return response.data.data;
    },
    createFull: async (data: CreateFullRequest): Promise<CreateFullResponse> => {
        const response = await axiosInstance.post(ENDPOINTS.INTENT_ENDPOINTS.CREATE_FULL, data);
        return response.data.data;
    },
    getIntentById: async (id: string): Promise<IntentDetailResponse> => {
        const response = await axiosInstance.get(ENDPOINTS.INTENT_ENDPOINTS.GET_BY_ID(id));
        return response.data.data;
    },
    updateIntent: async (id: string, data: any): Promise<IIntent> => {
        const response = await axiosInstance.put(ENDPOINTS.INTENT_ENDPOINTS.UPDATE(id), data);
        return response.data.data;
    },
    hardDeleteIntent: async (id: string): Promise<void> => {
        await axiosInstance.delete(ENDPOINTS.INTENT_ENDPOINTS.HARD_DELETE(id));
    },
    softDeleteIntent: async (id: string): Promise<void> => {
        await axiosInstance.delete(ENDPOINTS.INTENT_ENDPOINTS.SOFT_DELETE(id));
    },
    restoreIntent: async (id: string): Promise<void> => {
        await axiosInstance.patch(ENDPOINTS.INTENT_ENDPOINTS.RESTORE(id));
    },
    searchEntityForIntent: async (query: string): Promise<IEntity[]> => {
        const response = await axiosInstance.get(`${ENDPOINTS.ENTITY_ENDPOINTS.GET_ALL_PAGINATED}?${createEntityQuery({ search: query, limit: 5 })}`);
        return response.data.data;
    },
    geminiExamples: async (payload: IGeminiExampleRequest): Promise<string[]> => {
        const response = await axiosInstance.post(ENDPOINTS.INTENT_ENDPOINTS.GEMINI_EXAMPLES, payload);
        const data: GeminiExampleResponse = response.data.data;
        return data?.examples || [];
    }
}
