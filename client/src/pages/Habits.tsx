import type { FormEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Plus,
  X,
  Flame,
  Check,
  Star,
  MoreVertical,
  Pencil,
  Trash2,
  Hash,
} from "lucide-react";
import type { Habit, HabitCategory, HabitFrequencyType } from "../api/habits";
import {
  useHabits,
  useCreateHabit,
  useDeleteHabit,
  useToggleHabit,
} from "../hooks/useHabits";
import { WeeklyTracker } from "../components/habits/WeeklyTracker";
import { HabitGlyph } from "../components/habits/HabitGlyph";
import { HabitIconPicker } from "../components/habits/HabitIconPicker";
import { EditHabitForm } from "../components/habits/EditHabitForm";
import {
  CATEGORY_LABELS,
  HABIT_CATEGORIES,
  suggestionsForUserFocus,
  type HabitTemplate,
} from "../components/habits/habitVisuals";
import { useAuthStore } from "../stores/authStore";

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-100 focus:bg-zinc-900";

function CategoryBadge({ category }: { readonly category: HabitCategory }): ReactElement {
  return (
    <span className="shrink-0 rounded-md border border-zinc-800/80 bg-zinc-800/40 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-zinc-500">
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ─── XP Progress Bar ─── */

function XpProgressBar({
  xp,
  level,
}: {
  readonly xp: number;
  readonly level: number;
}): ReactElement {
  const xpInCurrentLevel = xp % 100;
  const percent = xpInCurrentLevel;

  return (
    <div className="mt-2 flex items-center gap-2.5">
      <span className="flex items-center gap-1 rounded-md bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
        <Star className="h-2.5 w-2.5" />
        Nv {level}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-zinc-600">
        {xpInCurrentLevel}/100
      </span>
    </div>
  );
}

/* ─── Dropdown Menu ─── */

function HabitOptionsMenu({
  onEdit,
  onDelete,
}: {
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current !== null && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
        aria-label="Opções"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-[140px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl">
            <button
              type="button"
              onClick={() => { setOpen(false); onEdit(); }}
              className="flex min-h-10 w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800"
            >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(); }}
              className="flex min-h-10 w-full items-center gap-2 px-3 py-2 text-xs text-red-400 transition hover:bg-zinc-800"
            >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Habit Card ─── */

function HabitRow({ habit }: { readonly habit: Habit }): ReactElement {
  const toggleHabit = useToggleHabit();
  const deleteHabitMutation = useDeleteHabit();
  const [editing, setEditing] = useState(false);
  const [iconPop, setIconPop] = useState(false);
  const today = getTodayKey();
  const isDoneToday = habit.completedDates.includes(today);
  const isToggling = toggleHabit.isPending;

  const handleToggle = (): void => {
    toggleHabit.mutate(
      { id: habit.id, date: today },
      {
        onSuccess: (data) => {
          if (data.habit.completedDates.includes(today)) {
            setIconPop(true);
            window.setTimeout(() => setIconPop(false), 600);
          }
        },
      },
    );
  };

  const handleDelete = (): void => {
    if (window.confirm("Tem certeza que deseja excluir este hábito e todo o seu progresso?")) {
      deleteHabitMutation.mutate(habit.id);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-zinc-700 md:p-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition disabled:opacity-50 ${
              isDoneToday
                ? "border-emerald-500/90 bg-emerald-500 text-zinc-950 shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)]"
                : "border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400"
            }`}
            aria-label={isDoneToday ? "Desmarcar hábito" : "Marcar hábito como feito"}
          >
            <Check className="h-5 w-5" strokeWidth={3} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <HabitGlyph
                    icon={habit.icon}
                    active={isDoneToday}
                    pop={iconPop}
                  />
                  <h3
                    className={`min-w-0 truncate text-sm font-medium ${
                      isDoneToday ? "text-zinc-400 line-through" : "text-zinc-100"
                    }`}
                  >
                    {habit.name}
                  </h3>
                  <CategoryBadge category={habit.category} />
                  {habit.frequencyType === "WEEKLY_TARGET" &&
                    habit.targetDaysPerWeek !== null && (
                      <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                        {habit.targetDaysPerWeek}x/sem
                      </span>
                    )}
                </div>
                {habit.description !== null && habit.description.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-zinc-600">{habit.description}</p>
                )}
              </div>
              <HabitOptionsMenu onEdit={() => setEditing(true)} onDelete={handleDelete} />
            </div>

            <XpProgressBar xp={habit.xp} level={habit.level} />

            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-600">
              <Hash className="h-2.5 w-2.5" />
              Total de check-ins: {habit.completedDates.length}
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-zinc-800/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5">
                <Flame
                  className={`h-4 w-4 ${
                    habit.currentStreak > 0 ? "text-orange-400" : "text-zinc-700"
                  }`}
                />
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    habit.currentStreak > 0 ? "text-orange-400" : "text-zinc-700"
                  }`}
                >
                  {habit.currentStreak}
                </span>
              </div>
              <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <WeeklyTracker completedDates={habit.completedDates} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <EditHabitForm habit={habit} onClose={() => setEditing(false)} />
      )}
    </>
  );
}

/* ─── Create Habit Form ─── */

function CreateHabitForm({
  onClose,
}: {
  readonly onClose: () => void;
}): ReactElement {
  const primaryFocus = useAuthStore((s) => s.user?.primaryFocus);
  const smartList = suggestionsForUserFocus(primaryFocus);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Activity");
  const [category, setCategory] = useState<HabitCategory>("PESSOAL");
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>("DAILY");
  const [targetDays, setTargetDays] = useState(3);
  const createHabit = useCreateHabit();

  const applyTemplate = (t: HabitTemplate): void => {
    setName(t.name);
    setIcon(t.icon);
    setCategory(t.category);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return;

    createHabit.mutate(
      {
        name: trimmedName,
        description:
          description.trim().length > 0 ? description.trim() : undefined,
        icon,
        category,
        frequencyType,
        targetDaysPerWeek:
          frequencyType === "WEEKLY_TARGET" ? targetDays : undefined,
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setIcon("Activity");
          setCategory("PESSOAL");
          setFrequencyType("DAILY");
          setTargetDays(3);
          onClose();
        },
      },
    );
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">Novo hábito</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Fechar formulário"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {smartList.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Sugestões para você
            </p>
            <div className="flex flex-wrap gap-2">
              {smartList.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-left text-xs text-zinc-300 transition hover:border-emerald-600/40 hover:bg-zinc-900"
                >
                  <span className="font-medium text-zinc-100">{t.name}</span>
                  <span className="mt-0.5 block text-[10px] text-zinc-600">
                    {CATEGORY_LABELS[t.category]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <HabitIconPicker value={icon} onChange={setIcon} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-500">Categoria</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as HabitCategory)}
            className={INPUT_CLASS}
          >
            {HABIT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do hábito"
          className={INPUT_CLASS}
          required
          autoFocus
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          className={INPUT_CLASS}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={frequencyType}
            onChange={(e) => setFrequencyType(e.target.value as HabitFrequencyType)}
            className={INPUT_CLASS}
          >
            <option value="DAILY">Todos os dias</option>
            <option value="WEEKLY_TARGET">Meta semanal</option>
          </select>

          {frequencyType === "WEEKLY_TARGET" && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={6}
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="w-16 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-center text-sm text-zinc-100 outline-none transition focus:border-zinc-100 focus:bg-zinc-900"
              />
              <span className="text-xs text-zinc-500">dias/sem</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={createHabit.isPending || name.trim().length === 0}
          className="min-h-11 w-full rounded-lg bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {createHabit.isPending ? "Criando..." : "Adicionar Hábito"}
        </button>
      </form>
    </div>
  );
}

/* ─── Página Principal ─── */

export function Habits(): ReactElement {
  const [showForm, setShowForm] = useState(false);
  const { data, isPending, isError } = useHabits();
  const habits = data?.habits ?? [];

  const doneCount = habits.filter((h) =>
    h.completedDates.includes(getTodayKey()),
  ).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 shrink-0 text-zinc-400" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              Hábitos
            </h1>
            {habits.length > 0 && (
              <p className="text-xs text-zinc-600">
                {doneCount}/{habits.length} feitos hoje
              </p>
            )}
          </div>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Novo Hábito
          </button>
        )}
      </div>

      {showForm && (
        <CreateHabitForm onClose={() => setShowForm(false)} />
      )}

      {isPending ? (
        <div className="flex justify-center py-16">
          <div className="flex items-center gap-3 text-zinc-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
            <span className="text-sm">Carregando hábitos...</span>
          </div>
        </div>
      ) : isError ? (
        <p className="py-16 text-center text-sm text-red-400/90">
          Erro ao carregar hábitos. Tente recarregar a página.
        </p>
      ) : habits.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-600">
          Nenhum hábito cadastrado. Crie seu primeiro hábito acima.
        </p>
      ) : (
        <div className="space-y-2.5">
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  );
}
