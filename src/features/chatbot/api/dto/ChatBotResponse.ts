export interface ChatBot {
  _id: string;
  name: string;
  ip: string;
  rasaPort: number;
  flaskPort: number;
  roles: (string | { _id: string; name?: string })[];
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  url?: string;
}

export interface ListChatBotResponse {
  success: boolean;
  data: ChatBot[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type ChatBotDetailResponse = ChatBot;

export interface ModelDetail {
  _id: string;
  name: string;
  url: string;
  description?: string;
  createdAt?: string;
  chatbotId?: string;
}

export interface ModelsListResponse {
  models: string[];
  total: number;
  details?: ModelDetail[];
}

export interface ActionsListResponse {
  actions: Array<{
    _id: string;
    name: string;
    description?: string;
    code?: string;
    createdAt?: string;
  }>;
  total: number;
}

export interface ServiceStatus {
  error?: string;
  status: "running" | "not_responding" | "offline";
  model_file?: string;
  [key: string]: any; // Allow additional properties
}

export interface HealthCheckResponse {
  success: boolean;
  data: {
    ActionsServer: ServiceStatus;
    RasaServer: ServiceStatus;
  };
  message: string;
}

export interface SendModelResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface RunModelResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface PushActionResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface RunActionResponse {
  success: boolean;
  message: string;
  data?: unknown;
}