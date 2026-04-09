import type { FormEvent, ReactElement } from "react";
import { useEffect, useState } from "react";
import { BookOpen, Check } from "lucide-react";
import type { Mood } from "../../api/journal";
import { useTodayJournal, useSaveJournal } from "../../hooks/useJournal";

type MoodOption = {
  readonly value: Mood;
  readonly emoji: string;
  readonly label: string;
  readonly activeClass: string;
};

const MOOD_OPTIONS: readonly MoodOption[] = [
  { value: "TERRIBLE", emoji: "😢", label: "Péssimo", activeClass: "bg-red-500/20 border-red-500/50" },
  { value: "BAD", emoji: "😕", label: "Ruim", activeClass: "bg-orange-500/20 border-orange-500/50" },
  { value: "NEUTRAL", emoji: "😐", label: "Neutro", activeClass: "bg-zinc-500/20 border-zinc-400/50" },
  { value: "GOOD", emoji: "🙂", label: "Bom", activeClass: "bg-emerald-500/20 border-emerald-500/50" },
  { value: "EXCELLENT", emoji: "🤩", label: "Ótimo", activeClass: "bg-amber-500/20 border-amber-500/50" },
];

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DailyCheckIn(): ReactElement {
  const { data, isPending } = useTodayJournal();
  const saveMutation = useSaveJournal();

  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated || isPending || data === undefined) return;
    const entry = data.entry;
    if (entry !== null) {
      setMood(entry.mood);
      setNote(entry.note ?? "");
    }
    setHydrated(true);
  }, [data, isPending, hydrated]);

  const hasSavedToday = data?.entry !== null && data?.entry !== undefined;

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (mood === null) return;

    saveMutation.mutate({
      date: todayKey(),
      mood,
      note: note.trim().length > 0 ? note.trim() : undefined,
    });
  };

  if (isPending) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded bg-zinc-800 animate-pulse" />
          <div className="h-4 w-32 rounded bg-zinc-800 animate-pulse" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-12 w-12 rounded-xl bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-400">Diário de Bordo</h2>
        </div>
        {hasSavedToday && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
            <Check className="h-3 w-3" />
            Registrado hoje
          </span>
        )}
      </div>

      {/* Mood selector */}
      <div>
        <p className="mb-2.5 text-xs text-zinc-500">Como você está se sentindo?</p>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = mood === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMood(opt.value)}
                className={`flex h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-xl border-2 text-lg transition sm:h-12 sm:w-12 sm:text-xl ${
                  isSelected
                    ? opt.activeClass
                    : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
                }`}
                aria-label={opt.label}
                title={opt.label}
              >
                {opt.emoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Como foi seu dia?"
        rows={2}
        className="w-full resize-none rounded-lg border border-zinc-800 bg-transparent px-3 py-2.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={mood === null || saveMutation.isPending}
        className="min-h-11 w-full rounded-lg bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saveMutation.isPending ? "Salvando..." : hasSavedToday ? "Atualizar Registro" : "Salvar Registro"}
      </button>
    </form>
  );
}
