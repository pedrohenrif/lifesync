import type { IHabitRepository } from "../../domain/repositories/IHabitRepository.js";
import {
  Habit,
  isHabitCategory,
  type HabitCategory,
  type HabitFrequencyType,
} from "../../domain/entities/Habit.js";
import {
  HabitModel,
  type PersistedHabit,
} from "./mongoose/HabitSchema.js";

function isPersistedHabit(value: unknown): value is PersistedHabit {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o._id === "string" &&
    typeof o.userId === "string" &&
    typeof o.name === "string" &&
    typeof o.frequencyType === "string" &&
    Array.isArray(o.completedDates) &&
    typeof o.xp === "number" &&
    typeof o.level === "number" &&
    o.createdAt instanceof Date
  );
}

export class MongoHabitRepository implements IHabitRepository {
  async save(habit: Habit): Promise<void> {
    await HabitModel.create({
      _id: habit.id,
      userId: habit.userId,
      name: habit.name,
      description: habit.description,
      icon: habit.icon,
      category: habit.category,
      frequencyType: habit.frequencyType,
      targetDaysPerWeek: habit.targetDaysPerWeek,
      completedDates: [...habit.completedDates],
      xp: habit.xp,
      level: habit.level,
      createdAt: habit.createdAt,
    });
  }

  async findById(id: string): Promise<Habit | null> {
    const doc = await HabitModel.findById(id).lean().exec();
    if (doc === null) {
      return null;
    }
    if (!isPersistedHabit(doc)) {
      throw new Error("Unexpected habit document shape from persistence");
    }
    return this.toDomain(doc);
  }

  async findAllByUserId(userId: string): Promise<Habit[]> {
    const docs = await HabitModel.find({ userId }).lean().exec();
    const habits: Habit[] = [];

    for (const doc of docs) {
      if (!isPersistedHabit(doc)) {
        throw new Error("Unexpected habit document shape from persistence");
      }
      habits.push(this.toDomain(doc));
    }

    return habits;
  }

  async update(habit: Habit): Promise<void> {
    await HabitModel.updateOne(
      { _id: habit.id },
      {
        $set: {
          name: habit.name,
          description: habit.description,
          icon: habit.icon,
          category: habit.category,
          frequencyType: habit.frequencyType,
          targetDaysPerWeek: habit.targetDaysPerWeek,
          completedDates: [...habit.completedDates],
          xp: habit.xp,
          level: habit.level,
        },
      },
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await HabitModel.deleteOne({ _id: id }).exec();
  }

  private toDomain(doc: PersistedHabit): Habit {
    const rawCat = doc.category;
    const category: HabitCategory =
      typeof rawCat === "string" && isHabitCategory(rawCat) ? rawCat : "PESSOAL";
    const icon =
      typeof doc.icon === "string" && doc.icon.trim().length > 0 ? doc.icon.trim() : "Activity";

    const result = Habit.create({
      id: doc._id,
      userId: doc.userId,
      name: doc.name,
      description: doc.description,
      icon,
      category,
      frequencyType: doc.frequencyType as HabitFrequencyType,
      targetDaysPerWeek: doc.targetDaysPerWeek,
      completedDates: doc.completedDates,
      xp: doc.xp,
      level: doc.level,
      createdAt: doc.createdAt,
    });
    if (!result.ok) {
      throw new Error(`Invalid habit persisted: ${result.error.code}`);
    }
    return result.habit;
  }
}
