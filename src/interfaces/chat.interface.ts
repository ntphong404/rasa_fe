export interface IChatMessage {
  recipient_id: string;
  text: string;
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
  chat: IChatHistoryMessage[];
  createdAt: string;
  updatedAt: string;
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