export interface MessageFeedbackItem {
  _id: string;
  messageId: string;
  botId: string;
  sourceType: 0 | 1;
  questionText: string;
  answerText: string;
  userId: string;
  vote: 0 | 1;
  createdAt: string;
  updatedAt: string;
}

export interface MessageFeedbackListData {
  data: MessageFeedbackItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  botId: string;
}

export interface MessageFeedbackListResponse {
  success: boolean;
  data: MessageFeedbackListData;
  message: string;
}

export interface MessageFeedbackItemResponse {
  success: boolean;
  data: MessageFeedbackItem;
  message: string;
}
