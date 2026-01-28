export interface UpdateDocRequest {
  _id: string;
  name?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  file?: File;
}
