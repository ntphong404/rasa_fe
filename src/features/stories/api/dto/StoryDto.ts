import { IStory } from '@/interfaces/story.interface';

export interface ListStoryResponse {
  success: boolean;
  message: string;
  data: IStory[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StoryDetailResponse {
  success: boolean;
  message: string;
  data: IStory;
}

export interface CreateStoryRequest {
  name: string;
  description?: string;
  define?: string;
  intents: string[];
  responses: string[];
  action: string[];
  entities: string[];
  slots: string[];
  roles: string[];
}

export interface UpdateStoryRequest extends CreateStoryRequest {
  _id: string;
}