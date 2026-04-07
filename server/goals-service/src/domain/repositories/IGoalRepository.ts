import type { Goal } from "../entities/Goal.js";

export type GoalFilter = {
  readonly category?: string;
};

export interface IGoalRepository {
  save(goal: Goal): Promise<void>;
  findById(id: string): Promise<Goal | null>;
  findAllByUserId(userId: string, filter?: GoalFilter): Promise<Goal[]>;
  update(goal: Goal): Promise<void>;
  delete(id: string): Promise<void>;
}
