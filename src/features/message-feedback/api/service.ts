import { chatService } from "@/features/chat/api/service";
import {
  MessageFeedbackListResponse,
  MessageFeedbackItemResponse,
} from "./dto/MessageFeedbackResponse";

export interface MessageFeedbackQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "asc" | "desc";
  sourceType?: string;
  startDate?: string;
  endDate?: string;
}

export const messageFeedbackService = {
  fetchMessageFeedbacks: async (
    chatbotId: string,
    query: MessageFeedbackQuery
  ): Promise<MessageFeedbackListResponse> => {
    const response = await chatService.getMessageFeedbackList(chatbotId, query);
    return response;
  },

  fetchMessageFeedbackById: async (
    chatbotId: string,
    feedbackId: string
  ): Promise<MessageFeedbackItemResponse> => {
    const response = await chatService.getMessageFeedbackById(chatbotId, feedbackId);
    return response;
  },

  hardDeleteMessageFeedback: async (
    chatbotId: string,
    feedbackId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await chatService.hardDeleteMessageFeedback(chatbotId, feedbackId);
    return response;
  },
};
