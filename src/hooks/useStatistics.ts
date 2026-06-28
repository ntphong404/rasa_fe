import { useQuery } from "@tanstack/react-query";
import { statisticService } from "@/features/statistics/api/service";

export const useUserStatistics = (params?: { botId?: string }) => {
  return useQuery({
    queryKey: ["statistics", "users", params],
    queryFn: () => statisticService.getUserStatistics(params),
    staleTime: 60000,
  });
};

export const useConversationStatistics = (params?: {
  startDate?: string;
  endDate?: string;
  botId?: string;
}) => {
  return useQuery({
    queryKey: ["statistics", "conversations", params],
    queryFn: () => statisticService.getConversationStatistics(params),
    staleTime: 30000,
  });
};

export const useChatbotStatistics = (params?: { botId?: string }) => {
  return useQuery({
    queryKey: ["statistics", "chatbots", params],
    queryFn: () => statisticService.getChatbotStatistics(params),
    staleTime: 60000,
  });
};

export const useNLPStatistics = (params?: { botId?: string }) => {
  return useQuery({
    queryKey: ["statistics", "nlp", params],
    queryFn: () => statisticService.getNLPStatistics(params),
    staleTime: 60000,
  });
};

export const useDocumentStatistics = (params?: { botId?: string }) => {
  return useQuery({
    queryKey: ["statistics", "documents", params],
    queryFn: () => statisticService.getDocumentStatistics(params),
    staleTime: 60000,
  });
};

export const useResponseFeedbackStatistics = (params?: {
  limit?: number;
  botId?: string;
}) => {
  return useQuery({
    queryKey: ["statistics", "responses-feedback", params],
    queryFn: () => statisticService.getResponseFeedbackStatistics(params),
    staleTime: 30000,
  });
};

export const useOverallStatistics = (params?: { botId?: string }) => {
  return useQuery({
    queryKey: ["statistics", "overall", params],
    queryFn: () => statisticService.getOverallStatistics(params),
    staleTime: 60000,
  });
};

export const useSystemStatistics = (params?: { botId?: string }) => {
  return useQuery({
    queryKey: ["statistics", "system", params],
    queryFn: () => statisticService.getSystemStatistics(params),
    staleTime: 60000,
  });
};
