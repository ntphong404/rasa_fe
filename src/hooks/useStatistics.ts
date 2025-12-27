import { useQuery } from "@tanstack/react-query";
import { statisticService } from "@/features/statistics/api/service";

export const useUserStatistics = () => {
  return useQuery({
    queryKey: ["statistics", "users"],
    queryFn: () => statisticService.getUserStatistics(),
    staleTime: 60000,
  });
};

export const useConversationStatistics = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ["statistics", "conversations", params],
    queryFn: () => statisticService.getConversationStatistics(params),
    staleTime: 30000,
  });
};

export const useChatbotStatistics = () => {
  return useQuery({
    queryKey: ["statistics", "chatbots"],
    queryFn: () => statisticService.getChatbotStatistics(),
    staleTime: 60000,
  });
};

export const useNLPStatistics = () => {
  return useQuery({
    queryKey: ["statistics", "nlp"],
    queryFn: () => statisticService.getNLPStatistics(),
    staleTime: 60000,
  });
};

export const useDocumentStatistics = () => {
  return useQuery({
    queryKey: ["statistics", "documents"],
    queryFn: () => statisticService.getDocumentStatistics(),
    staleTime: 60000,
  });
};

export const useOverallStatistics = () => {
  return useQuery({
    queryKey: ["statistics", "overall"],
    queryFn: () => statisticService.getOverallStatistics(),
    staleTime: 60000,
  });
};
