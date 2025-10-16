export interface StoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  deleted?: boolean;
  sort?: string;
  createdBy?: string;
  updatedBy?: string;
  startDate?: string;
  endDate?: string;
}

export default function createStoryQuery(query: StoryQuery): string {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.append("page", query.page.toString());
  if (query.limit !== undefined) params.append("limit", query.limit.toString());
  if (query.search) params.append("search", query.search);
  if (query.deleted !== undefined) params.append("deleted", query.deleted.toString());
  if (query.sort) params.append("sort", query.sort);
  if (query.createdBy) params.append("createdBy", query.createdBy);
  if (query.updatedBy) params.append("updatedBy", query.updatedBy);
  if (query.startDate) params.append("startDate", query.startDate);
  if (query.endDate) params.append("endDate", query.endDate);

  return params.toString();
}