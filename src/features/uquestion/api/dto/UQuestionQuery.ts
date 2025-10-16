export interface UQuestionQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "asc" | "desc";
  chatbotId?: string;
  startDate?: string;
  endDate?: string;
}

export default function createUQuestionQuery(query: UQuestionQuery): string {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.append("page", query.page.toString());
  if (query.limit !== undefined) params.append("limit", query.limit.toString());
  if (query.search) params.append("search", query.search);
  if (query.sort) params.append("sort", query.sort);
  if (query.chatbotId) params.append("chatbotId", query.chatbotId);
  if (query.startDate) params.append("startDate", query.startDate);
  if (query.endDate) params.append("endDate", query.endDate);

  return params.toString();
}