// UQuestionResponse.ts
export interface UQuestion {
  _id: string;
  question: string;
  botId?: string;
  chatbotId: string | { _id: string; name?: string };
  reason?: string;
  isInDomain?: boolean;
  count?: number;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListUQuestionResponse {
  success: boolean;
  data: {
    data: UQuestion[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}

export interface UQuestionDetailResponse {
  success: boolean;
  data: UQuestion;
  message: string;
}

