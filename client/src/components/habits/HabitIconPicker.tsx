import type { ReactElement } from "react";
import {
  Activity,
  Apple,
  BookOpen,
  Brain,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Lightbulb,
  Moon,
  Music,
  PenLine,
  PiggyBank,
  Smartphone,
  Sun,
  Target,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { LUCIDE_HABIT_ICON_NAMES, QUICK_EMOJI_ICONS } from "./habitVisuals";

const LUCIDE_MAP: Record<string, LucideIcon> = {
  Activity,
  Flame,
  BookOpen,
  Brain,
  Coffee,
  Droplets,
  Moon,
  Sun,
  Dumbbell,
  Heart,
  Wallet,
  PiggyBank,
  Target,
  Zap,
  PenLine,
  Music,
  Smartphone,
  Apple,
  Footprints,
  Lightbulb,
};

export function HabitIconPicker({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (icon: string) => void;
}): ReactElement {
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Ícone</span>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_EMOJI_ICONS.map((emoji) => {
          const selected = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition ${
                selected
                  ? "border-emerald-500/60 bg-emerald-500/15 ring-1 ring-emerald-500/40"
                  : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
              }`}
              aria-label={`Emoji ${emoji}`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LUCIDE_HABIT_ICON_NAMES.map((name) => {
          const Ico = LUCIDE_MAP[name];
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              title={name}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                selected
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
              aria-label={name}
            >
              <Ico className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
