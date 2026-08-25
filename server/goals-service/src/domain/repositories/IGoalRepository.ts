import type { Goal, GoalStatus } from "../entities/Goal.js";
import type { Paginated, PaginationParams } from "../pagination.js";

export type GoalFilter = {
  readonly category?: string;
  /** Vazio ou ausente traz todos os status. */
  readonly statuses?: readonly GoalStatus[];
};

export interface IGoalRepository {
  save(goal: Goal): Promise<void>;
  findById(id: string): Promise<Goal | null>;
  findAllByUserId(
    userId: string,
    pagination: PaginationParams,
    filter?: GoalFilter,
  ): Promise<Paginated<Goal>>;
  update(goal: Goal): Promise<void>;
  delete(id: string): Promise<void>;
}
