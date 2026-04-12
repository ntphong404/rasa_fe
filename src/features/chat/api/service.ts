import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { useChatbotStore } from "@/store/chatbot";
import {
  ISendMessageRequest,
  ISendMessageResponse,
  IConversationsResponse,
  IConversation,
  IConversationMutationResponse,
  IShareConversationResponse,
} from "@/interfaces/chat.interface";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8888";

type StreamEvent = {
  type?: string;
  text?: string;
  buttons?: any[];
  items?: string[];
  intent?: string;
  confidence?: number;
  streaming?: boolean;
  source?: string;
  sender_id?: string;
  message?: string;
  detail?: string;
};

type StreamEventHandler = (event: StreamEvent) => void | Promise<void>;

export const chatService = {
  sendMessage: async (
    data: ISendMessageRequest
  ): Promise<ISendMessageResponse> => {
    const response = await axiosInstance.post(
      ENDPOINTS.CHAT_ENDPOINTS.SEND_MESSAGE_SYSTEM,
      data
    );
    return response.data;
  },

  sendMessageStream: async (
    data: ISendMessageRequest,
    onEvent: StreamEventHandler
  ): Promise<void> => {
    const token = localStorage.getItem("authToken");
    const selectedChatBotId = useChatbotStore.getState().selectedChatBotId;
    const scopedBotId =
      selectedChatBotId && selectedChatBotId !== "global" ? selectedChatBotId : null;

    const url = new URL(
      ENDPOINTS.CHAT_ENDPOINTS.SEND_MESSAGE_SYSTEM_STREAM,
      BASE_URL
    );

    if (scopedBotId) {
      url.searchParams.set("botId", scopedBotId);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => "");
      throw new Error(errorText || `Streaming failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        try {
          await onEvent(JSON.parse(line) as StreamEvent);
        } catch {
          // Ignore malformed chunk and continue streaming.
        }
      }
    }

    if (buffer.trim()) {
      try {
        await onEvent(JSON.parse(buffer.trim()) as StreamEvent);
      } catch {
        // Ignore malformed tail chunk.
      }
    }
  },

  getConversations: async (
    userId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
    }
  ): Promise<IConversationsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);

    const url = `${ENDPOINTS.CHAT_ENDPOINTS.GET_CONVERSATIONS(userId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getArchivedConversations: async (
    userId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
    }
  ): Promise<IConversationsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);

    const url = `${ENDPOINTS.CHAT_ENDPOINTS.GET_ARCHIVED_CONVERSATIONS(userId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getConversationById: async (
    conversationId: string
  ): Promise<{ success: boolean; data: IConversation; message: string }> => {
    const response = await axiosInstance.get(
      ENDPOINTS.CHAT_ENDPOINTS.GET_CONVERSATION_BY_ID(conversationId)
    );
    return response.data;
  },

  deleteConversation: async (
    conversationId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(
      ENDPOINTS.CHAT_ENDPOINTS.DELETE_CONVERSATION(conversationId)
    );
    return response.data;
  },

  clearAllConversations: async (
    userId: string
  ): Promise<{ success: boolean; message: string; data: { deletedCount: number } }> => {
    const response = await axiosInstance.delete(
      ENDPOINTS.CHAT_ENDPOINTS.CLEAR_ALL_CONVERSATIONS(userId)
    );
    return response.data;
  },

  renameConversation: async (
    conversationId: string,
    title: string
  ): Promise<IConversationMutationResponse> => {
    const response = await axiosInstance.patch(
      ENDPOINTS.CHAT_ENDPOINTS.RENAME_CONVERSATION(conversationId),
      { title }
    );
    return response.data;
  },

  pinConversation: async (
    conversationId: string,
    pinned?: boolean
  ): Promise<IConversationMutationResponse> => {
    const response = await axiosInstance.patch(
      ENDPOINTS.CHAT_ENDPOINTS.PIN_CONVERSATION(conversationId),
      { pinned }
    );
    return response.data;
  },

  archiveConversation: async (
    conversationId: string,
    archived?: boolean
  ): Promise<IConversationMutationResponse> => {
    const response = await axiosInstance.patch(
      ENDPOINTS.CHAT_ENDPOINTS.ARCHIVE_CONVERSATION(conversationId),
      { archived }
    );
    return response.data;
  },

  shareConversation: async (
    conversationId: string
  ): Promise<IShareConversationResponse> => {
    const response = await axiosInstance.post(
      ENDPOINTS.CHAT_ENDPOINTS.SHARE_CONVERSATION(conversationId)
    );
    return response.data;
  },

  submitMessageFeedback: async (
    chatbotId: string,
    payload: {
      messageId: string;
      userId: string;
      sourceType: 0 | 1;
      questionText: string;
      answerText: string;
      vote: 0 | 1;
    }
  ): Promise<any> => {
    const response = await axiosInstance.post(
      ENDPOINTS.CHATBOT_ENDPOINTS.MESSAGE_FEEDBACK(chatbotId),
      payload
    );
    return response.data;
  },

  getMessageFeedbackList: async (
    chatbotId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: "asc" | "desc";
      sourceType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any> => {
    const response = await axiosInstance.get(
      ENDPOINTS.CHATBOT_ENDPOINTS.MESSAGE_FEEDBACK_LIST(chatbotId),
      { params }
    );
    return response.data;
  },

  getMessageFeedbackById: async (
    chatbotId: string,
    feedbackId: string
  ): Promise<any> => {
    const response = await axiosInstance.get(
      ENDPOINTS.CHATBOT_ENDPOINTS.MESSAGE_FEEDBACK_DETAIL(chatbotId, feedbackId)
    );
    return response.data;
  },

  hardDeleteMessageFeedback: async (
    chatbotId: string,
    feedbackId: string
  ): Promise<any> => {
    const response = await axiosInstance.delete(
      ENDPOINTS.CHATBOT_ENDPOINTS.MESSAGE_FEEDBACK_HARD_DELETE(chatbotId, feedbackId)
    );
    return response.data;
  },

  getSuggestedQuestions: async (
    limit = 8
  ): Promise<any> => {
    const response = await axiosInstance.get(
      ENDPOINTS.CHATBOT_ENDPOINTS.GET_SUGGESTIONS_SYSTEM,
      { params: { limit } }
    );
    return response.data;
  },

  getSuggestedQuestionsList: async (
    chatbotId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: "asc" | "desc";
    }
  ): Promise<any> => {
    const response = await axiosInstance.get(
      ENDPOINTS.CHATBOT_ENDPOINTS.SUGGESTED_QUESTIONS_LIST(chatbotId),
      { params }
    );
    return response.data;
  },

  getSuggestedQuestionById: async (
    chatbotId: string,
    questionId: string
  ): Promise<any> => {
    const response = await axiosInstance.get(
      ENDPOINTS.CHATBOT_ENDPOINTS.SUGGESTED_QUESTION_DETAIL(chatbotId, questionId)
    );
    return response.data;
  },

  createSuggestedQuestion: async (
    chatbotId: string,
    data: { question: string; reason?: string }
  ): Promise<any> => {
    const response = await axiosInstance.post(
      ENDPOINTS.CHATBOT_ENDPOINTS.SUGGESTED_QUESTIONS_LIST(chatbotId),
      data
    );
    return response.data;
  },

  updateSuggestedQuestion: async (
    chatbotId: string,
    questionId: string,
    data: { question?: string; reason?: string }
  ): Promise<any> => {
    const response = await axiosInstance.put(
      ENDPOINTS.CHATBOT_ENDPOINTS.SUGGESTED_QUESTION_DETAIL(chatbotId, questionId),
      data
    );
    return response.data;
  },

  hardDeleteSuggestedQuestion: async (
    chatbotId: string,
    questionId: string
  ): Promise<any> => {
    const response = await axiosInstance.delete(
      ENDPOINTS.CHATBOT_ENDPOINTS.SUGGESTED_QUESTION_DETAIL(chatbotId, questionId)
    );
    return response.data;
  },

  incrementSuggestedQuestionCount: async (
    chatbotId: string,
    questionId: string
  ): Promise<any> => {
    const response = await axiosInstance.patch(
      ENDPOINTS.CHATBOT_ENDPOINTS.SUGGESTED_QUESTION_DETAIL(chatbotId, questionId) + '/increment-count'
    );
    return response.data;
  }
}
