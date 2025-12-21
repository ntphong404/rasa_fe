import { IDoc } from "@/interfaces/doc.interface";

export interface ListDocResponse {
  success: boolean;
  data: IDoc[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}

export interface DocDetailResponse {
  success: boolean;
  data: IDoc;
  message: string;
}
