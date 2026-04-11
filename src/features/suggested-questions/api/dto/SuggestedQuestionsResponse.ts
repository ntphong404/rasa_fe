export interface SuggestedQuestion {
  _id: string;
  question: string;
  normalizedQuestion?: string;
  chatbotId: string;
  reason?: string;
  isInDomain: boolean;
  count?: number;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedQuestionsListData {
  data: SuggestedQuestion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  chatbotId: string;
}

export interface SuggestedQuestionsListResponse {
  success: boolean;
  data: SuggestedQuestionsListData;
  message: string;
}

export interface SuggestedQuestionItemResponse {
  success: boolean;
  data: SuggestedQuestion;
  message: string;
}

export interface SuggestedQuestionCreateResponse {
  success: boolean;
  data: SuggestedQuestion;
  message: string;
}

export interface SuggestedQuestionUpdateResponse {
  success: boolean;
  data: SuggestedQuestion;
  message: string;
}

export interface SuggestedQuestionDeleteResponse {
  success: boolean;
  message: string;
}
