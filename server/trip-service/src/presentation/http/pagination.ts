import { z } from "zod";
import type { Paginated } from "../../domain/pagination.js";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationMeta = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly hasMore: boolean;
};

export function toPaginationMeta(source: Paginated<unknown>): PaginationMeta {
  return {
    page: source.page,
    pageSize: source.pageSize,
    total: source.total,
    hasMore: source.hasMore,
  };
}
