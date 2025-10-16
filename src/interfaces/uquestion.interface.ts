export interface IUQuestion {
  _id: string;
  question: string;
  chatbotId: string;
  
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  deletedAt?: Date;
  
  createdBy?: string;
  updatedBy?: string;
}
