import { IRasaComponentQuery } from '@/interfaces/common.interface';

export interface SlotQuery extends IRasaComponentQuery {
  botId?: string;
  createdBy?: string;
  updatedBy?: string;
  startDate?: string;
  endDate?: string;
}

export default function createSlotQuery(query: SlotQuery): string {
  const params = new URLSearchParams();

  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.search) params.append('search', query.search);
  if (query.deleted !== undefined) params.append('deleted', query.deleted.toString());
  if (query.sort) params.append('sort', query.sort);
  if (query.botId) params.append('botId', query.botId);
  if (query.createdBy) params.append('createdBy', query.createdBy);
  if (query.updatedBy) params.append('updatedBy', query.updatedBy);
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);

  return params.toString();
}