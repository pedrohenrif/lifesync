import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Briefcase,
  HeartPulse,
  Plug,
  Shirt,
  SprayCan,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { PackingCategory } from "../api/trips";

export type PackingCategoryMeta = {
  readonly label: string;
  readonly icon: LucideIcon;
};

export const PACKING_CATEGORY_META: Record<PackingCategory, PackingCategoryMeta> = {
  ROUPA: { label: "Roupas", icon: Shirt },
  HIGIENE: { label: "Higiene", icon: SprayCan },
  ELETRONICO: { label: "Eletrônicos", icon: Plug },
  DOCUMENTO: { label: "Documentos", icon: Wallet },
  SAUDE: { label: "Saúde", icon: HeartPulse },
  OUTRO: { label: "Outros", icon: Briefcase },
};

/** Datas da viagem são YYYY-MM-DD; o T00:00:00 evita leitura em UTC. */
export function parseTripDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function formatTripRange(startDate: string, endDate: string): string {
  const start = parseTripDate(startDate);
  const end = parseTripDate(endDate);
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  const startLabel = format(start, sameMonth ? "d" : "d 'de' MMM", { locale: ptBR });
  const endLabel = format(end, "d 'de' MMM, yyyy", { locale: ptBR });
  return `${startLabel} – ${endLabel}`;
}

export function formatDueDate(value: string): string {
  return format(parseTripDate(value), "d 'de' MMM", { locale: ptBR });
}

export type TripPhase = {
  readonly label: string;
  readonly toneClass: string;
};

/**
 * A fase sai das datas em vez de um campo de status, que ficaria desatualizado
 * sem alguém marcar a mudança.
 */
export function getTripPhase(startDate: string, endDate: string): TripPhase {
  const today = new Date();
  const daysToStart = differenceInCalendarDays(parseTripDate(startDate), today);
  const daysToEnd = differenceInCalendarDays(parseTripDate(endDate), today);

  if (daysToEnd < 0) {
    return { label: "Concluída", toneClass: "text-zinc-600" };
  }
  if (daysToStart <= 0) {
    return { label: "Em andamento", toneClass: "text-emerald-500" };
  }
  if (daysToStart === 1) {
    return { label: "Amanhã", toneClass: "text-amber-500" };
  }
  if (daysToStart <= 7) {
    return { label: `Em ${daysToStart} dias`, toneClass: "text-amber-500" };
  }
  return { label: `Em ${daysToStart} dias`, toneClass: "text-blue-500" };
}
