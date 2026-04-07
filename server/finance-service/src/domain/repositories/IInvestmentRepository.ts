import type { Investment } from "../entities/Investment.js";

export interface IInvestmentRepository {
  save(investment: Investment): Promise<void>;
  findById(id: string): Promise<Investment | null>;
  findAllByUserId(userId: string): Promise<Investment[]>;
  update(investment: Investment): Promise<void>;
  delete(id: string): Promise<void>;
}
