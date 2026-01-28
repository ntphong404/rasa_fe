export interface CreateDocRequest {
  name: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  file: File;
}
