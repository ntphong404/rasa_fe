import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { ITrainRequest, ITrainResponse, IModelsListResponse, IModel } from "@/interfaces/train.interface";
import { IRule } from "@/interfaces/rule.interface";
import { IStory } from "@/interfaces/story.interface";
import { IChatbot } from "@/interfaces/chatbot.interface";

export interface TrainQuery {
  page?: number;
  limit?: number;
  chatbotId?: string;
  botId?: string;
}

const createTrainQuery = (query: TrainQuery): string => {
  const params = new URLSearchParams();

  if (query.page) params.append("page", query.page.toString());
  if (query.limit) params.append("limit", query.limit.toString());
  if (query.chatbotId) params.append("chatbotId", query.chatbotId);
  if (query.botId) params.append("botId", query.botId);

  return params.toString();
};

export const trainingService = {
  // Train model
  trainModel: async (chatbotId: string, data: ITrainRequest): Promise<ITrainResponse> => {
    const response = await axiosInstance.post(
      ENDPOINTS.TRAINING_ENDPOINTS.TRAIN_MODEL(chatbotId),
      data
    );
    return response.data;
  },

  // Train all isActiveForTraining=true items (optionally filtered by importBatchIds)
  trainActive: async (
    chatbotId: string,
    options?: { firetune?: boolean; importBatchIds?: string[] }
  ): Promise<ITrainResponse> => {
    const response = await axiosInstance.post(
      ENDPOINTS.TRAINING_ENDPOINTS.TRAIN_ACTIVE(chatbotId),
      options ?? {}
    );
    return response.data;
  },


  // Get models list
  getModels: async (query: TrainQuery): Promise<IModelsListResponse> => {
    const response = await axiosInstance.get(
      `${ENDPOINTS.TRAINING_ENDPOINTS.GET_MODELS}?${createTrainQuery(query)}`
    );
    return response.data;
  },

  // Get model by ID
  getModelById: async (id: string): Promise<{ data: IModel }> => {
    const response = await axiosInstance.get(
      ENDPOINTS.TRAINING_ENDPOINTS.GET_MODEL_BY_ID(id)
    );
    return response.data;
  },

  // Get all rules for selection
  getAllRules: async (botId?: string): Promise<{ data: IRule[] }> => {
    const response = await axiosInstance.get(
      `${ENDPOINTS.RULE_ENDPOINTS.GET_ALL_PAGINATED}?${createTrainQuery({ limit: 1000, page: 1, botId })}`
    );
    return response.data;
  },

  // Get all stories for selection
  getAllStories: async (botId?: string): Promise<{ data: IStory[] }> => {
    const response = await axiosInstance.get(
      `${ENDPOINTS.STORY_ENDPOINTS.GET_ALL_PAGINATED}?${createTrainQuery({ limit: 1000, page: 1, botId })}`
    );
    return response.data;
  },

  // Get all chatbots for selection
  getAllChatbots: async (): Promise<{ data: IChatbot[] }> => {
    const response = await axiosInstance.get(
      `${ENDPOINTS.CHATBOT_ENDPOINTS.GET_ALL_PAGINATED}?limit=1000&page=1`
    );
    return response.data;
  }
};

// ── My Model (MinIO push) ──────────────────────────────────────────────────
export interface IPresignRequest {
  originalFileName: string;
  fileSize: number;
}

export interface IPresignResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    bucket: string;
    objectName: string;
    expiredAt: string;
  };
  message: string;
}

export interface IPushModelResponse {
  success: boolean;
  data: {
    model: import("@/interfaces/train.interface").IModel;
    realUrl: string;
  };
  message: string;
}

export interface IDeleteModelResponse {
  success: boolean;
  data: object;
  message: string;
}

export interface IRealUrlResponse {
  success: boolean;
  data: { realUrl: string };
  message: string;
}

export const myModelService = {
  /** Bước 1: Lấy presigned PUT URL để client tự upload lên MinIO */
  generatePresignedUrl: async (data: IPresignRequest): Promise<IPresignResponse> => {
    const response = await axiosInstance.post(
      ENDPOINTS.MY_MODEL_ENDPOINTS.PRESIGN,
      data
    );
    return response.data;
  },

  /** Bước 2a: Upload file trực tiếp lên MinIO qua presigned PUT URL (không qua backend) */
  uploadToMinIO: async (uploadUrl: string, file: File): Promise<void> => {
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": "application/octet-stream" },
    });
  },

  /** Bước 2b: Lưu metadata sau khi upload xong */
  pushModel: async (objectName: string, description?: string): Promise<IPushModelResponse> => {
    const response = await axiosInstance.post(
      ENDPOINTS.MY_MODEL_ENDPOINTS.PUSH,
      { objectName, description }
    );
    return response.data;
  },

  /** Upload trực tiếp qua backend (multipart/form-data) — luồng cũ */
  pushModelDirect: async (file: File, description?: string): Promise<IPushModelResponse> => {
    const formData = new FormData();
    formData.append("model", file);
    if (description) formData.append("description", description);
    const response = await axiosInstance.post(
      ENDPOINTS.MY_MODEL_ENDPOINTS.PUSH,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  /** Lấy presigned GET URL để download model */
  getRealUrl: async (id: string): Promise<IRealUrlResponse> => {
    const response = await axiosInstance.get(
      ENDPOINTS.MY_MODEL_ENDPOINTS.GET_REAL_URL(id)
    );
    return response.data;
  },

  /** Xóa model (cả MinIO lẫn MongoDB) */
  deleteModel: async (id: string): Promise<IDeleteModelResponse> => {
    const response = await axiosInstance.delete(
      ENDPOINTS.MY_MODEL_ENDPOINTS.HARD_DELETE(id)
    );
    return response.data;
  },
};

