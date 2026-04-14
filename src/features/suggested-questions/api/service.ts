import { chatService } from "@/features/chat/api/service";
import {
  SuggestedQuestionsListResponse,
  SuggestedQuestionItemResponse,
  SuggestedQuestionCreateResponse,
  SuggestedQuestionUpdateResponse,
  SuggestedQuestionDeleteResponse,
} from "./dto/SuggestedQuestionsResponse";

export interface SuggestedQuestionQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "asc" | "desc";
}

export const suggestedQuestionService = {
  fetchSuggestedQuestions: async (
    chatbotId: string,
    query: SuggestedQuestionQuery
  ): Promise<SuggestedQuestionsListResponse> => {
    const response = await chatService.getSuggestedQuestionsList(chatbotId, query);
    return response;
  },

  fetchSuggestedQuestionById: async (
    chatbotId: string,
    questionId: string
  ): Promise<SuggestedQuestionItemResponse> => {
    const response = await chatService.getSuggestedQuestionById(chatbotId, questionId);
    return response;
  },

  createSuggestedQuestion: async (
    chatbotId: string,
    data: { question: string; reason?: string }
  ): Promise<SuggestedQuestionCreateResponse> => {
    const response = await chatService.createSuggestedQuestion(chatbotId, data);
    return response;
  },

  updateSuggestedQuestion: async (
    chatbotId: string,
    questionId: string,
    data: { question?: string; reason?: string }
  ): Promise<SuggestedQuestionUpdateResponse> => {
    const response = await chatService.updateSuggestedQuestion(chatbotId, questionId, data);
    return response;
  },

  hardDeleteSuggestedQuestion: async (
    chatbotId: string,
    questionId: string
  ): Promise<SuggestedQuestionDeleteResponse> => {
    const response = await chatService.hardDeleteSuggestedQuestion(chatbotId, questionId);
    return response;
  },
};
