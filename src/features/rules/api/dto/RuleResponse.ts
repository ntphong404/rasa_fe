import { IRule } from "@/interfaces/rule.interface";

export interface ListRuleResponse {
  success: boolean;
  data: IRule[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RuleDetailResponse extends IRule {
  // Có thể thêm các trường khác nếu cần
}
