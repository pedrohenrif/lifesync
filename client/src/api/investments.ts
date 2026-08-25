import { financeRequest, FinanceApiError } from "./finance";
import {
  buildPageQuery,
  readPaginationMeta,
  type Page,
  type PageRequest,
} from "./pagination";

export { FinanceApiError };

export type Investment = {
  readonly id: string;
  readonly name: string;
  readonly investedAmount: number;
  readonly currentBalance: number;
  readonly profitAmount: number;
  readonly profitPercent: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type InvestmentTotals = {
  readonly totalInvested: number;
  readonly totalBalance: number;
};

export type InvestmentsPage = Page<Investment> & InvestmentTotals;

export type CreateInvestmentInput = {
  readonly name: string;
  readonly investedAmount: number;
};

type InvestmentsResponse = InvestmentTotals & { readonly investments: readonly Investment[] };

export async function getInvestments(request: PageRequest = {}): Promise<InvestmentsPage> {
  const data = await financeRequest<InvestmentsResponse>(
    `/investments${buildPageQuery(request)}`,
  );
  const items = data.investments ?? [];
  return {
    items,
    pagination: readPaginationMeta(data, items.length),
    totalInvested: data.totalInvested,
    totalBalance: data.totalBalance,
  };
}

export async function createInvestment(
  input: CreateInvestmentInput,
): Promise<{ investment: Investment }> {
  return financeRequest<{ investment: Investment }>("/investments", {
    method: "POST",
    body: input,
  });
}

export async function updateInvestmentBalance(
  id: string,
  currentBalance: number,
): Promise<{ id: string; currentBalance: number; profitAmount: number; profitPercent: number }> {
  return financeRequest("/investments/" + id + "/balance", {
    method: "PATCH",
    body: { currentBalance },
  });
}

export async function addInvestmentContribution(
  id: string,
  amount: number,
): Promise<{ id: string; investedAmount: number; currentBalance: number; profitAmount: number; profitPercent: number }> {
  return financeRequest("/investments/" + id + "/contribute", {
    method: "PATCH",
    body: { amount },
  });
}

export async function deleteInvestment(id: string): Promise<null> {
  return financeRequest<null>(`/investments/${id}`, { method: "DELETE" });
}

export async function renameInvestment(
  id: string,
  name: string,
): Promise<{ id: string; name: string }> {
  return financeRequest(`/investments/${id}/name`, {
    method: "PATCH",
    body: { name },
  });
}
