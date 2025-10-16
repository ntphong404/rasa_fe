export interface IRasaComponentQuery {
  page?: number;
  limit?: number;
  search?: string;
  deleted?: boolean;
  sort?: 'ASC' | 'DESC';
}