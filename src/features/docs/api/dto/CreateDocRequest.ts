export interface CreateDocRequest {
  botId?: string;
  name: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  file: File;
}
