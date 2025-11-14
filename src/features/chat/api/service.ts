import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { ISendMessageRequest, ISendMessageResponse, IConversationsResponse } from "@/interfaces/chat.interface";

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
    // params?: {
    //   page?: number;
    //   limit?: number;
    //   sort?: string;
    // }
  ): Promise<IConversationsResponse> => {
    // const queryParams = new URLSearchParams();
    // if (params?.page) queryParams.append('page', params.page.toString());
    // if (params?.limit) queryParams.append('limit', params.limit.toString());
    // if (params?.sort) queryParams.append('sort', params.sort);

    const url = `${ENDPOINTS.CHAT_ENDPOINTS.GET_CONVERSATIONS(userId)}`;
    const response = await axiosInstance.get(url);
    return response.data;
  }
}