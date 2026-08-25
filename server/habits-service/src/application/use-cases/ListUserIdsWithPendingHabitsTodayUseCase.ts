import type { HabitReminderRow, IHabitRepository } from "../../domain/repositories/IHabitRepository.js";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Segunda-feira da semana local da data (YYYY-MM-DD). */
function weekStartMondayKey(ref: Date): string {
  const copy = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return toDateKey(copy);
}

function weekEndSundayFromMonday(mondayKey: string): string {
  const [y, mo, d] = mondayKey.split("-").map((x) => Number.parseInt(x, 10));
  const dt = new Date(y, mo - 1, d);
  dt.setDate(dt.getDate() + 6);
  return toDateKey(dt);
}

function completionsInWeekRange(
  completedDates: readonly string[],
  start: string,
  end: string,
): number {
  return completedDates.filter((k) => k >= start && k <= end).length;
}

function isPendingToday(row: HabitReminderRow, todayKey: string, now: Date): boolean {
  if (row.frequencyType === "DAILY") {
    return !row.completedDates.includes(todayKey);
  }
  if (row.frequencyType === "WEEKLY_TARGET") {
    const target = row.targetDaysPerWeek ?? 1;
    const start = weekStartMondayKey(now);
    const end = weekEndSundayFromMonday(start);
    const done = completionsInWeekRange(row.completedDates, start, end);
    return done < target;
  }
  return false;
}

export class ListUserIdsWithPendingHabitsTodayUseCase {
  constructor(private readonly habitRepository: IHabitRepository) {}

  /**
   * Usuários que ainda têm pelo menos um hábito “pendente” para o dia corrente
   * (diário sem check hoje, ou semanal abaixo da meta da semana).
   */
  async execute(referenceDate: Date = new Date()): Promise<readonly string[]> {
    const todayKey = toDateKey(referenceDate);
    const rows = await this.habitRepository.findAllForReminderProjection();
    const ids = new Set<string>();
    for (const row of rows) {
      if (isPendingToday(row, todayKey, referenceDate)) {
        ids.add(row.userId);
      }
    }
    return [...ids];
  }
}
