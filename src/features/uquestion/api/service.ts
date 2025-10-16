import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { ListUQuestionResponse, UQuestionDetailResponse } from "../api/dto/UQuestionResponse";
import createUQuestionQuery, { UQuestionQuery } from "../api/dto/UQuestionQuery";

export const uQuestionService = {
  fetchUQuestions: async (query: UQuestionQuery): Promise<ListUQuestionResponse> => {
    const response = await axiosInstance.get(`${ENDPOINTS.UQUESTION_ENDPOINTS.GET_ALL_PAGINATED}?${createUQuestionQuery(query)}`);
    return response.data;
  },

  getUQuestionById: async (id: string): Promise<UQuestionDetailResponse> => {
    const response = await axiosInstance.get(ENDPOINTS.UQUESTION_ENDPOINTS.GET_BY_ID(id));
    return response.data;
  },

  hardDeleteUQuestion: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.UQUESTION_ENDPOINTS.HARD_DELETE(id));
  },
};