import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import {
  OverallStatistics,
  UserStatistics,
  ConversationStatistics,
  ChatbotStatistics,
  NLPStatistics,
  DocumentStatistics,
  SystemStatistics,
  StatisticsResponse,
} from "@/interfaces/statistic.interface";

export const statisticService = {
  getOverallStatistics: async (): Promise<StatisticsResponse<OverallStatistics>> => {
    const response = await axiosInstance.get(ENDPOINTS.STATISTIC_ENDPOINTS.OVERALL);
    return response.data;
  },

  getUserStatistics: async (): Promise<StatisticsResponse<UserStatistics>> => {
    const response = await axiosInstance.get(ENDPOINTS.STATISTIC_ENDPOINTS.USERS);
    return response.data;
  },

  getConversationStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<StatisticsResponse<ConversationStatistics>> => {
    const response = await axiosInstance.get(
      ENDPOINTS.STATISTIC_ENDPOINTS.CONVERSATIONS,
      { params }
    );
    return response.data;
  },

  getChatbotStatistics: async (): Promise<StatisticsResponse<ChatbotStatistics>> => {
    const response = await axiosInstance.get(ENDPOINTS.STATISTIC_ENDPOINTS.CHATBOTS);
    return response.data;
  },

  getNLPStatistics: async (): Promise<StatisticsResponse<NLPStatistics>> => {
    const response = await axiosInstance.get(ENDPOINTS.STATISTIC_ENDPOINTS.NLP);
    return response.data;
  },

  getDocumentStatistics: async (): Promise<StatisticsResponse<DocumentStatistics>> => {
    const response = await axiosInstance.get(ENDPOINTS.STATISTIC_ENDPOINTS.DOCUMENTS);
    return response.data;
  },

  getSystemStatistics: async (): Promise<StatisticsResponse<SystemStatistics>> => {
    const response = await axiosInstance.get(ENDPOINTS.STATISTIC_ENDPOINTS.SYSTEM);
    return response.data;
  },
};
