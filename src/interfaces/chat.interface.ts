export interface IRasaButton {
  title: string;
  payload: string;
  type?: string;
}

export interface IChatMessage {
  recipient_id: string;
  text: string;
  buttons?: IRasaButton[];
  messageId?: string;
  sourceType?: "rasa" | "rag" | "system" | "unknown";
  answerKey?: string;
  isStreaming?: boolean;
  intent?: string;
  confidence?: number;
}

export interface ISendMessageRequest {
  message: string;
  conversationId: string;
  userId: string;
  isLogined: boolean;
}

export interface ISendMessageResponse {
  success: boolean;
  data: IChatMessage[];
  message: string;
}

export interface IChatHistoryMessage {
  role: "user" | "bot";
  message: string | string[];
}

export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface IConversation {
  _id: string;
  conversationId: string;
  userId: IUser;
  title?: string;
  pinned?: boolean;
  archived?: boolean;
  chat: IChatHistoryMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface IConversationMutationResponse {
  success: boolean;
  data: IConversation;
  message: string;
}

export interface IShareConversationResponse {
  success: boolean;
  data: {
    conversationId: string;
    sharePath: string;
  };
  message: string;
d?: boolean;
  archived?: boolean;
  chat: IChatHistoryMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface IConversationMutationResponse {
  success: boolean;
  data: IConversation;
  message: string;
}

export interface IShareConversationResponse {
  success: boolean;
  data: {
    conversationId: string;
    sharePath: string;
  };
  message: string;
}

export interface IConversationsResponse {
  success: boolean;
  data: IConversation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}

export interface IChatConversation {
  id: string;
  messages: IChatMessage[];
  createdAt: Date;
}