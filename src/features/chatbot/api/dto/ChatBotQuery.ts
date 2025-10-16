import { ChatBotQuery } from "./ChatBotRequests";

export function createChatBotQuery(query: ChatBotQuery): string {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.append("page", query.page.toString());
  if (query.limit !== undefined) params.append("limit", query.limit.toString());
  if (query.search) params.append("search", query.search);
  if (query.deleted !== undefined) params.append("deleted", query.deleted.toString());
  if (query.sort) params.append("sort", query.sort);
  if (query.startDate) params.append("startDate", query.startDate);
  if (query.endDate) params.append("endDate", query.endDate);

  return params.toString();
}