import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import type { Habit, HabitCategory, HabitFrequencyType } from "../../api/habits";
import { useUpdateHabit } from "../../hooks/useHabits";
import { AppModalShell } from "../ui/AppModalShell";
import { HabitIconPicker } from "./HabitIconPicker";
import { HABIT_CATEGORIES, CATEGORY_LABELS } from "./habitVisuals";

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-100 focus:bg-zinc-900";

export function EditHabitForm({
  habit,
  onClose,
}: {
  readonly habit: Habit;
  readonly onClose: () => void;
}): ReactElement {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description ?? "");
  const [icon, setIcon] = useState(habit.icon);
  const [category, setCategory] = useState<HabitCategory>(habit.category);
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>(habit.frequencyType);
  const [targetDays, setTargetDays] = useState(habit.targetDaysPerWeek ?? 3);
  const updateHabit = useUpdateHabit();

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    updateHabit.mutate(
      {
        id: habit.id,
        input: {
          name: trimmed,
          description: description.trim().length > 0 ? description.trim() : null,
          icon,
          category,
          frequencyType,
          targetDaysPerWeek: frequencyType === "WEEKLY_TARGET" ? targetDays : null,
        },
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <AppModalShell title="Editar hábito" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
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

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-lg border border-zinc-800 py-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateHabit.isPending || name.trim().length === 0}
            className="min-h-11 flex-1 rounded-lg bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {updateHabit.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </AppModalShell>
  );
}
