import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE, type Page, type PageRequest } from "../api/pagination";

type UseInfiniteListOptions<TPage> = {
  readonly queryKey: QueryKey;
  readonly fetchPage: (request: PageRequest) => Promise<TPage>;
  readonly pageSize?: number;
  readonly enabled?: boolean;
};

/**
 * Encapsula o padrão de listagem paginada: acumula os itens de todas as páginas
 * carregadas e expõe o total real vindo do servidor.
 */
export function useInfiniteList<TItem, TPage extends Page<TItem>>({
  queryKey,
  fetchPage,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseInfiniteListOptions<TPage>) {
  const query = useInfiniteQuery({
    queryKey: [...queryKey, { pageSize }],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage({ page: pageParam, pageSize }),
    getNextPageParam: (lastPage: TPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
  });

  const pages = query.data?.pages ?? [];
  const items: TItem[] = pages.flatMap((page) => [...page.items]);
  const total = pages[0]?.pagination.total ?? items.length;

  return {
    ...query,
    /** Primeira página carregada, útil para totais agregados que vêm junto da lista. */
    firstPage: pages[0],
    items,
    total,
  };
}
