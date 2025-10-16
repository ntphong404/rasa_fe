// UQuestionResponse.ts
export interface UQuestion {
  _id: string;
  question: string;
  chatbotId: string | { _id: string; name?: string };
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

