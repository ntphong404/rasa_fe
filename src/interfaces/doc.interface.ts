export interface IDoc {
  _id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  objectKey: string;
  fileType: string;
  fileSize: number;
  isPublic: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
