export interface DocQuery {
  page?: number;
  limit?: number;
  search?: string;
  deleted?: boolean;
  sort?: string;
  createdBy?: string;
  updatedBy?: string;
  startDate?: string;
  endDate?: string;
  tags?: string;
}

function createDocQuery(query: DocQuery): string {
  let queryString = `page=${query.page || 1}&limit=${query.limit || 10}`;
  if (query.search) {
    queryString += `&search=${query.search}`;
  }
  if (query.deleted !== undefined) {
    queryString += `&deleted=${query.deleted}`;
  }
  if (query.sort) {
    queryString += `&sort=${query.sort}`;
  }
  if (query.createdBy) {
    queryString += `&createdBy=${query.createdBy}`;
  }
  if (query.updatedBy) {
    queryString += `&updatedBy=${query.updatedBy}`;
  }
  if (query.startDate) {
    queryString += `&startDate=${query.startDate}`;
  }
  if (query.endDate) {
    queryString += `&endDate=${query.endDate}`;
  }
  if (query.tags) {
    queryString += `&tags=${query.tags}`;
  }
  return queryString;
}

export default createDocQuery;
