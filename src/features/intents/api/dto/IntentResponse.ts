import { IEntity } from "@/interfaces/entity.interface";
import { IIntent } from "@/interfaces/intent.interface";

export interface IExamplePopulated {
  _id: string;
  text: string;
}

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
  examples: IExamplePopulated[]
  label?: string
  botId?: string
  botIds?: string[]
  entities: IEntity[]
  roles: string[]
  createdAt: Date
  updatedAt: Date
  deleted: boolean
  deletedAt?: Date
}

export interface CreateFullResponse {
  intent: any
  response: any
  rule: any
  duplicateExamples: Array<{
    text: string
    ownedByIntentName: string | null
  }>
}
