import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import {
  ISendMessageRequest,
  ISendMessageResponse,
  IConversationsResponse,
  IConversation,
  IConversationMutationResponse,
  IShareConversationResponse,
} from "@/interfaces/chat.interface";

export const chatService = {
  sendMessage: async (
    chatbotId: string,
    data: ISendMessageRequest
  ): Promise<ISendMessageResponse> => {
    const response = await axiosInstance.post(
      ENDPOINTS.CHAT_ENDPOINTS.SEND_MESSAGE(chatbotId),
      data
    );
    return response.data;
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
  }
}