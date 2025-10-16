import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import {
  StoryDetailResponse,
  ListStoryResponse,
  CreateStoryRequest,
  UpdateStoryRequest
} from "./dto/StoryDto";
import { IStory } from "@/interfaces/story.interface";
import { IIntent } from "@/interfaces/intent.interface";
import createIntentQuery from "@/features/intents/api/dto/IntentQuery";
import { IAction } from "@/interfaces/action.interface";
import createActionQuery from "@/features/action/api/dto/ActionQuery";
import { IMyResponse } from "@/interfaces/response.interface";
import { responseService } from "@/features/reponses/api/service";
import { IEntity } from "@/interfaces/entity.interface";
import createEntityQuery from "@/features/entity/api/dto/EnityQuery";
import createStoryQuery, { StoryQuery } from "./dto/StoryQuery";

export const storyService = {
  fetchStories: async (query: StoryQuery): Promise<ListStoryResponse> => {
    const response = await axiosInstance.get(`${ENDPOINTS.STORY_ENDPOINTS.GET_ALL_PAGINATED}?${createStoryQuery(query)}`);
    return response.data;
  },

  getStoryById: async (id: string): Promise<StoryDetailResponse> => {
    const response = await axiosInstance.get(ENDPOINTS.STORY_ENDPOINTS.GET_BY_ID(id));
    return response.data;
  },

  createStory: async (data: CreateStoryRequest): Promise<IStory> => {
    const response = await axiosInstance.post(ENDPOINTS.STORY_ENDPOINTS.CREATE, data);
    return response.data.data;
  },

  updateStory: async (id: string, data: UpdateStoryRequest): Promise<IStory> => {
    const response = await axiosInstance.put(ENDPOINTS.STORY_ENDPOINTS.UPDATE(id), data);
    return response.data.data;
  },

  softDeleteStory: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.STORY_ENDPOINTS.SOFT_DELETE(id));
  },

  hardDeleteStory: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.STORY_ENDPOINTS.HARD_DELETE(id));
  },

  restoreStory: async (id: string): Promise<void> => {
    await axiosInstance.patch(ENDPOINTS.STORY_ENDPOINTS.RESTORE(id));
  },

  searchIntentForStory: async (query: string): Promise<IIntent[]> => {
    const response = await axiosInstance.get(`${ENDPOINTS.INTENT_ENDPOINTS.GET_ALL_PAGINATED}?${createIntentQuery({ search: query, limit: 5 })}`);
    return response.data.data;
  },

  searchActionForStory: async (query: string): Promise<IAction[]> => {
    const response = await axiosInstance.get(`${ENDPOINTS.ACTION_ENDPOINTS.GET_ALL_PAGINATED}?${createActionQuery({ search: query, limit: 5 })}`);
    return response.data.data;
  },

  searchResponseForStory: async (query: string): Promise<IMyResponse[]> => {
    const response = await responseService.fetchResponses(`search=${query}&limit=5`);
    return response.data;
  },

  searchEntityForStory: async (query: string): Promise<IEntity[]> => {
    const response = await axiosInstance.get(`${ENDPOINTS.ENTITY_ENDPOINTS.GET_ALL_PAGINATED}?${createEntityQuery({ search: query, limit: 5 })}`);
    return response.data.data;
  },

};