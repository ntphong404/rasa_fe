import { IStory } from "@/interfaces/story.interface";

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