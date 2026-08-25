export interface PaginationParams {
  /** Página 1-based. */
  readonly page: number;
  readonly pageSize: number;
}

export interface Paginated<TItem> {
  readonly items: readonly TItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly hasMore: boolean;
}

export function toSkip(params: PaginationParams): number {
  return (params.page - 1) * params.pageSize;
}

export function buildPaginated<TItem>(
  items: readonly TItem[],
  total: number,
  params: PaginationParams,
): Paginated<TItem> {
  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    total,
    hasMore: params.page * params.pageSize < total,
  };
}

export function mapPaginated<TFrom, TTo>(
  source: Paginated<TFrom>,
  map: (item: TFrom) => TTo,
): Paginated<TTo> {
  return {
    items: source.items.map(map),
    page: source.page,
    pageSize: source.pageSize,
    total: source.total,
    hasMore: source.hasMore,
  };
}
