import { IRasaComponentQuery } from '@/interfaces/common.interface';

export interface SlotQuery extends IRasaComponentQuery {
  type?: string;
}

export default function createSlotQuery(query: SlotQuery): string {
  const params = new URLSearchParams();

  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.search) params.append('search', query.search);
  if (query.deleted !== undefined) params.append('deleted', query.deleted.toString());
  if (query.sort) params.append('sort', query.sort);
  if (query.type) params.append('type', query.type);

  return params.toString();
}