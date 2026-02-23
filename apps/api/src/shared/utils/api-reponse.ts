export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StandardResponse<T> {
  data: T;
  metadata: PaginationMetadata | null;
}

export const buildPaginatedData = <T,>(
  data: T[],
  total: number,
  page: number,
  limit: number
): StandardResponse<T[]> => ({
  data,
  metadata: {
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  },
});

export const buildSingleData = <T,>(data: T): StandardResponse<T> => ({
  data,
  metadata: null,
});