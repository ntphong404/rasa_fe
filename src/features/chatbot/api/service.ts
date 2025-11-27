// api/service.ts

import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import {
  ChatBot,
  ChatBotDetailResponse,
  ListChatBotResponse,
  ModelsListResponse,
  ActionsListResponse,
  HealthCheckResponse,
  SendModelResponse,
  RunModelResponse,
  PushActionResponse,
  ModelDetail
} from "./dto/ChatBotResponse";
import {
  CreateChatBotRequest,
  UpdateChatBotRequest,
  SendModelRequest,
  RunModelRequest,
  PushActionRequest,
  ChatBotQuery
} from "./dto/ChatBotRequests";
import { createChatBotQuery } from "./dto/ChatBotQuery";

export const chatBotService = {
  fetchChatBots: async (query: ChatBotQuery): Promise<ListChatBotResponse> => {
    const response = await axiosInstance.get(`${ENDPOINTS.CHATBOT_ENDPOINTS.GET_ALL_PAGINATED}?${createChatBotQuery(query)}`);
    return response.data;
  },

  createChatBot: async (data: CreateChatBotRequest): Promise<ChatBot> => {
    const response = await axiosInstance.post(ENDPOINTS.CHATBOT_ENDPOINTS.CREATE, data);
    return response.data.data;
  },

  getChatBotById: async (id: string): Promise<ChatBotDetailResponse> => {
    const response = await axiosInstance.get(ENDPOINTS.CHATBOT_ENDPOINTS.GET_BY_ID(id));
    return response.data.data;
  },

  updateChatBot: async (id: string, data: UpdateChatBotRequest): Promise<ChatBot> => {
    const response = await axiosInstance.put(ENDPOINTS.CHATBOT_ENDPOINTS.UPDATE(id), data);
    return response.data.data;
  },

  hardDeleteChatBot: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.CHATBOT_ENDPOINTS.HARD_DELETE(id));
  },

  softDeleteChatBot: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.CHATBOT_ENDPOINTS.SOFT_DELETE(id));
  },

  restoreChatBot: async (id: string): Promise<void> => {
    await axiosInstance.patch(ENDPOINTS.CHATBOT_ENDPOINTS.RESTORE(id));
  },

  getModelsList: async (id: string): Promise<ModelsListResponse> => {
    const response = await axiosInstance.get(ENDPOINTS.CHATBOT_ENDPOINTS.GET_MODELS_LIST(id));
    return response.data.data;
  },

  getActionsList: async (id: string): Promise<ActionsListResponse> => {
    const response = await axiosInstance.get(ENDPOINTS.CHATBOT_ENDPOINTS.GET_ACTIONS_LIST(id));
    return response.data.data;
  },

  healthCheck: async (id: string): Promise<HealthCheckResponse> => {
    const response = await axiosInstance.get(ENDPOINTS.CHATBOT_ENDPOINTS.HEALTH_CHECK(id));
    return response.data;
  },

  sendModel: async (id: string, data: SendModelRequest): Promise<SendModelResponse> => {
    const response = await axiosInstance.post(ENDPOINTS.CHATBOT_ENDPOINTS.SEND_MODEL(id), data);
    return response.data.data;
  },

  runModel: async (id: string, data: RunModelRequest): Promise<RunModelResponse> => {
    const response = await axiosInstance.post(ENDPOINTS.CHATBOT_ENDPOINTS.RUN_MODEL(id), data);
    return response.data.data;
  },

  pushAction: async (id: string, data: PushActionRequest): Promise<PushActionResponse> => {
    const response = await axiosInstance.post(ENDPOINTS.CHATBOT_ENDPOINTS.PUSH_ACTION(id), data);
    return response.data.data;
  },

  runActionsServer: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await axiosInstance.post(ENDPOINTS.CHATBOT_ENDPOINTS.RUN_ACTION(id));
    return response.data;
  },
};

// My Model Service
interface MyModelQuery {
  page?: number;
  limit?: number;
  chatbotId?: string;
  search?: string;
  deleted?: boolean;
  parentId?: string;
  isOriginal?: boolean;
  startDate?: string;
  endDate?: string;
}

interface MyModelPaginateResponse {
  success: boolean;
  data: ModelDetail[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const myModelService = {
  getPaginate: async (query: MyModelQuery): Promise<MyModelPaginateResponse> => {
    const params = new URLSearchParams();

    if (query.page !== undefined) params.append("page", query.page.toString());
    if (query.limit !== undefined) params.append("limit", query.limit.toString());
    if (query.chatbotId) params.append("chatbotId", query.chatbotId);
    if (query.search) params.append("search", query.search);
    if (query.deleted !== undefined) params.append("deleted", query.deleted.toString());
    if (query.parentId) params.append("parentId", query.parentId);
    if (query.isOriginal !== undefined) params.append("isOriginal", query.isOriginal.toString());
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);

    const response = await axiosInstance.get(`api/v1/my-model?${params.toString()}`);
    return response.data;
  },
};