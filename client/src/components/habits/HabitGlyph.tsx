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
import { LUCIDE_HABIT_ICON_NAMES } from "./habitVisuals";

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

function isLucideHabitIcon(name: string): boolean {
  return (LUCIDE_HABIT_ICON_NAMES as readonly string[]).includes(name);
}

export type HabitGlyphProps = {
  readonly icon: string;
  readonly className?: string;
  /** Destaque quando o hábito foi feito hoje (cor + escala). */
  readonly active?: boolean;
  /** Dispara animação curta (ex.: após check-in). */
  readonly pop?: boolean;
};

export function HabitGlyph({
  icon,
  className = "",
  active = false,
  pop = false,
}: HabitGlyphProps): ReactElement {
  const resolved = icon.trim().length > 0 ? icon.trim() : "Activity";
  const LucideIconComp = isLucideHabitIcon(resolved) ? LUCIDE_MAP[resolved] : null;

  const color = active ? "text-emerald-400" : "text-zinc-400";
  const popClass = pop ? "habit-icon-pop" : "";

  if (LucideIconComp !== null && LucideIconComp !== undefined) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${popClass}`}>
        <LucideIconComp
          className={`h-5 w-5 transition-colors duration-300 ${color} ${active ? "scale-110" : ""} ${className}`}
          aria-hidden
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center text-lg leading-none transition-transform duration-300 ${color} ${active ? "scale-110" : ""} ${popClass} ${className}`}
      aria-hidden
    >
      {resolved}
    </span>
  );
}
