import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import {
  OverallStatistics,
  UserStatistics,
  ConversationStatistics,
  ChatbotStatistics,
  NLPStatistics,
  DocumentStatistics,
  ResponseFeedbackStatistics,
  SystemStatistics,
  StatisticsResponse,
} from "@/interfaces/statistic.interface";

export const statisticService = {
  getOverallStatistics: async (params?: {
    botId?: string;
  }): Promise<StatisticsResponse<OverallStatistics>> => {
    const response = await axiosInstance.get(
      ENDPOINTS.STATISTIC_ENDPOINTS.OVERALL,
      { params }
    );
    return response.data;
  },

  getUserStatistics: async (params?: {
    botId?: string;
  }): Promise<StatisticsResponse<UserStatistics>> => {
    const response = await axiosInstance.get(
      ENDPOINTS.STATISTIC_ENDPOINTS.USERS,
      { params }
    );
    return response.data;
  },

  getConversationStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
    botId?: string;
  }): Promise<StatisticsResponse<ConversationStatistics>> => {
    const response = await axiosInstance.get(
      ENDPOINTS.STATISTIC_ENDPOINTS.CONVERSATIONS,
      { params }
    );
    return response.data;
  },

  getChatbotStatistics: async (params?: {
    botId?: string;
  }): Promise<StatisticsResponse<ChatbotStatistics>> => {
    const response = await axiosInstance.get(
      ENDPOINTS.STATISTIC_ENDPOINTS.CHATBOTS,
      { params }
    );
    return response.data;
  },

  getNLPStatistics: async (params?: {
    botId?: string;
  }): Promise<StatisticsResponse<NLPStatistics>> => {
    const response = await axiosInstance.get(
      ENDPOINTS.STATISTIC_ENDPOINTS.NLP,
      { params }
    );
    return response.data;
  },

  getDocumentStatistics: async (params?: {
    botId?: string;
  }): Promise<StatisticsResponse<DocumentStatistics>> => {
    const response = await axiosInstance.get(
      ENDPOINTS.STATISTIC_ENDPOINTS.DOCUMENTS,
      { params }
    );
    return response.data;
  },

  getResponseFeedbackStatistics: async (params?: {
    limit?: number;
    botId?: string;
  }): Promise<StatisticsResponse<ResponseFeedbackStatistics>> => {
    const response = await axiosInstance.get(
      ENDPOINTS.STATISTIC_ENDPOINTS.RESPONSES_FEEDBACK,
      { params }
    );
    return response.data;
  },

  getSystemStatistics: async (params?: {
    botId?: string;
  }): Promise<StatisticsResponse<SystemStatistics>> => {
    const response = await axiosInstance.get(
      ENDPOINTS.STATISTIC_ENDPOINTS.SYSTEM,
      { params }
    );
    return response.data;
  },
};
