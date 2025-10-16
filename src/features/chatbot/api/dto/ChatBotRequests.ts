export interface ChatBotQuery {
  page?: number;
  limit?: number;
  search?: string;
  deleted?: boolean;
  sort?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateChatBotRequest {
  name: string;
  ip: string;
  rasaPort: number;
  flaskPort: number;
  roles?: string[];
}

export interface UpdateChatBotRequest {
  _id: string;
  name: string;
  ip: string;
  rasaPort: number;
  flaskPort: number;
  roles?: string[];
}

export interface SendModelRequest {
  modelId: string;
}

export interface RunModelRequest {
  modelName: string;
}

export interface PushActionRequest {
  modelId?: string;
  actionIds?: string[];
}
