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
}

const createTrainQuery = (query: TrainQuery): string => {
  const params = new URLSearchParams();

  if (query.page) params.append("page", query.page.toString());
  if (query.limit) params.append("limit", query.limit.toString());
  if (query.chatbotId) params.append("chatbotId", query.chatbotId);

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
  getAllRules: async (): Promise<{ data: IRule[] }> => {
    const response = await axiosInstance.get(
      `${ENDPOINTS.RULE_ENDPOINTS.GET_ALL_PAGINATED}?limit=1000&page=1`
    );
    return response.data;
  },

  // Get all stories for selection
  getAllStories: async (): Promise<{ data: IStory[] }> => {
    const response = await axiosInstance.get(
      `${ENDPOINTS.STORY_ENDPOINTS.GET_ALL_PAGINATED}?limit=1000&page=1`
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
