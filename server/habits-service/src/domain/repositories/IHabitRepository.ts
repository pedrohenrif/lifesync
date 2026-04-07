import type { Habit } from "../entities/Habit.js";

/**
 * Contrato de persistência — implementação na Infrastructure (Mongoose).
 */
export interface IHabitRepository {
  save(habit: Habit): Promise<void>;
  findById(id: string): Promise<Habit | null>;
  findAllByUserId(userId: string): Promise<Habit[]>;
  update(habit: Habit): Promise<void>;
  delete(id: string): Promise<void>;
}
