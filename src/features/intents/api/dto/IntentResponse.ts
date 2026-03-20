import { IEntity } from "@/interfaces/entity.interface";
import { IIntent } from "@/interfaces/intent.interface";

export interface ListIntentResponse {
    success: boolean;
    data: IIntent[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

export interface IntentDetailResponse {
  _id: string
  name: string
  description: string
  define: string // yaml text
  label?: string
  botId?: string
  entities: IEntity[]
  roles: string[]
  createdAt: Date
  updatedAt: Date
  deleted: boolean
  deletedAt?: Date
}