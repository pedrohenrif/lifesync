import { financeRequest, FinanceApiError } from "./finance";

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

export type InvestmentsListResponse = {
  readonly investments: readonly Investment[];
  readonly totalInvested: number;
  readonly totalBalance: number;
};

export type CreateInvestmentInput = {
  readonly name: string;
  readonly investedAmount: number;
};

export async function getInvestments(): Promise<InvestmentsListResponse> {
  return financeRequest<InvestmentsListResponse>("/investments");
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

export async function deleteInvestment(id: string): Promise<null> {
  return financeRequest<null>(`/investments/${id}`, { method: "DELETE" });
}
