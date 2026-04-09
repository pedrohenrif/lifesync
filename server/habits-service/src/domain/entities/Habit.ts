export type HabitFrequencyType = "DAILY" | "WEEKLY_TARGET";

/** Categorias fixas (sem acentos no payload/API). */
export type HabitCategory = "SAUDE" | "FOCO" | "FINANCAS" | "PESSOAL";

export interface HabitProps {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string | null;
  /** Emoji (ex: "📚") ou nome de ícone Lucide em PascalCase (ex: "Activity"). */
  readonly icon: string;
  readonly category: HabitCategory;
  readonly frequencyType: HabitFrequencyType;
  readonly targetDaysPerWeek: number | null;
  readonly completedDates: readonly string[];
  readonly xp: number;
  readonly level: number;
  readonly createdAt: Date;
}

export type HabitValidationError =
  | { readonly code: "NAME_REQUIRED" }
  | { readonly code: "USER_ID_REQUIRED" }
  | { readonly code: "INVALID_TARGET_DAYS" }
  | { readonly code: "INVALID_CATEGORY" };

export type CreateHabitResult =
  | { readonly ok: true; readonly habit: Habit }
  | { readonly ok: false; readonly error: HabitValidationError };

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const HABIT_CATEGORIES: readonly HabitCategory[] = [
  "SAUDE",
  "FOCO",
  "FINANCAS",
  "PESSOAL",
];

export function isHabitCategory(value: string): value is HabitCategory {
  return (HABIT_CATEGORIES as readonly string[]).includes(value);
}

function subtractDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - n);
  return copy;
}

/**
 * Calcula a sequência atual contando dias consecutivos de trás para frente.
 * Se hoje está completo, começa a contar de hoje.
 * Se não, começa de ontem (permite que o usuário ainda não tenha feito hoje).
 * Se ontem também não está, streak = 0.
 */
function computeCurrentStreak(completedDates: readonly string[]): number {
  if (completedDates.length === 0) return 0;

  const set = new Set(completedDates);
  const today = new Date();
  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(subtractDays(today, 1));

  let startDate: Date;
  if (set.has(todayKey)) {
    startDate = today;
  } else if (set.has(yesterdayKey)) {
    startDate = subtractDays(today, 1);
  } else {
    return 0;
  }

  let streak = 0;
  let cursor = startDate;
  while (set.has(toDateKey(cursor))) {
    streak++;
    cursor = subtractDays(cursor, 1);
  }

  return streak;
}

/** Calcula o nível a partir do XP total (100 XP por nível). */
export function computeLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export class Habit {
  private constructor(private readonly props: HabitProps) {}

  static create(props: HabitProps): CreateHabitResult {
    if (props.userId.trim().length === 0) {
      return { ok: false, error: { code: "USER_ID_REQUIRED" } };
    }
    if (props.name.trim().length === 0) {
      return { ok: false, error: { code: "NAME_REQUIRED" } };
    }
    if (
      props.frequencyType === "WEEKLY_TARGET" &&
      (props.targetDaysPerWeek === null ||
        props.targetDaysPerWeek < 1 ||
        props.targetDaysPerWeek > 6)
    ) {
      return { ok: false, error: { code: "INVALID_TARGET_DAYS" } };
    }

    if (!isHabitCategory(props.category)) {
      return { ok: false, error: { code: "INVALID_CATEGORY" } };
    }

    const iconTrimmed = props.icon.trim();
    const icon = iconTrimmed.length > 0 ? iconTrimmed : "Activity";

    return {
      ok: true,
      habit: new Habit({
        ...props,
        name: props.name.trim(),
        description: props.description?.trim() ?? null,
        icon,
        category: props.category,
      }),
    };
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get icon(): string {
    return this.props.icon;
  }
  get category(): HabitCategory {
    return this.props.category;
  }
  get frequencyType(): HabitFrequencyType {
    return this.props.frequencyType;
  }
  get targetDaysPerWeek(): number | null {
    return this.props.targetDaysPerWeek;
  }
  get completedDates(): readonly string[] {
    return this.props.completedDates;
  }
  get xp(): number {
    return this.props.xp;
  }
  get level(): number {
    return this.props.level;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  get currentStreak(): number {
    return computeCurrentStreak(this.props.completedDates);
  }

  /** Retorna true se a data está no array (é um uncheck ao togglear). */
  hasDate(date: string): boolean {
    return this.props.completedDates.includes(date);
  }

  withToggledDate(date: string): Habit {
    const set = new Set(this.props.completedDates);
    if (set.has(date)) {
      set.delete(date);
    } else {
      set.add(date);
    }
    const result = Habit.create({
      ...this.props,
      completedDates: [...set].sort(),
    });
    if (!result.ok) {
      throw new Error(`Unexpected validation error: ${result.error.code}`);
    }
    return result.habit;
  }

  /** Retorna nova instância com dados gerais atualizados (nome, descrição, frequência). */
  updateDetails(data: {
    readonly name?: string;
    readonly description?: string | null;
    readonly icon?: string;
    readonly category?: HabitCategory;
    readonly frequencyType?: HabitFrequencyType;
    readonly targetDaysPerWeek?: number | null;
  }): CreateHabitResult {
    const nextCategory = data.category ?? this.props.category;
    if (!isHabitCategory(nextCategory)) {
      return { ok: false, error: { code: "INVALID_CATEGORY" } };
    }
    const nextIconRaw = data.icon !== undefined ? data.icon.trim() : this.props.icon;
    const nextIcon = nextIconRaw.length > 0 ? nextIconRaw : "Activity";
    return Habit.create({
      ...this.props,
      name: data.name ?? this.props.name,
      description: data.description !== undefined ? data.description : this.props.description,
      icon: nextIcon,
      category: nextCategory,
      frequencyType: data.frequencyType ?? this.props.frequencyType,
      targetDaysPerWeek: data.targetDaysPerWeek !== undefined ? data.targetDaysPerWeek : this.props.targetDaysPerWeek,
    });
  }

  /** Adiciona XP e recalcula o nível. Retorna novo Habit + flag de level up. */
  withXpGain(amount: number): { habit: Habit; leveledUp: boolean } {
    const newXp = this.props.xp + amount;
    const newLevel = computeLevel(newXp);
    const leveledUp = newLevel > this.props.level;

    const result = Habit.create({
      ...this.props,
      xp: newXp,
      level: newLevel,
    });
    if (!result.ok) {
      throw new Error(`Unexpected validation error: ${result.error.code}`);
    }
    return { habit: result.habit, leveledUp };
  }
}
