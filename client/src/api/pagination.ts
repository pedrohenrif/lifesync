export type PaginationMeta = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly hasMore: boolean;
};

export type PageRequest = {
  readonly page?: number;
  readonly pageSize?: number;
};

export type Page<TItem> = {
  readonly items: readonly TItem[];
  readonly pagination: PaginationMeta;
};

export const DEFAULT_PAGE_SIZE = 20;

type QueryValue = string | number | undefined;

export function buildQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function buildPageQuery(
  request: PageRequest = {},
  extra: Record<string, QueryValue> = {},
): string {
  return buildQueryString({
    page: request.page ?? 1,
    pageSize: request.pageSize ?? DEFAULT_PAGE_SIZE,
    ...extra,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Lê o bloco `pagination` da resposta. Se o backend ainda não enviar o bloco
 * (deploy parcial), trata a resposta como página única.
 */
export function readPaginationMeta(value: unknown, itemCount: number): PaginationMeta {
  const raw = isRecord(value) ? value.pagination : undefined;
  if (!isRecord(raw)) {
    return { page: 1, pageSize: itemCount, total: itemCount, hasMore: false };
  }
  return {
    page: readNumber(raw.page, 1),
    pageSize: readNumber(raw.pageSize, itemCount),
    total: readNumber(raw.total, itemCount),
    hasMore: typeof raw.hasMore === "boolean" ? raw.hasMore : false,
  };
}
