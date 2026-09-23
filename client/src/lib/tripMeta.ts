import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bed,
  Briefcase,
  Bus,
  HeartPulse,
  Plane,
  Plug,
  Shirt,
  SprayCan,
  Ticket,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { PackingCategory, ReservationType } from "../api/trips";

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

export type ReservationTypeMeta = {
  readonly label: string;
  readonly icon: LucideIcon;
};

export const RESERVATION_TYPE_META: Record<ReservationType, ReservationTypeMeta> = {
  FLIGHT: { label: "Voo", icon: Plane },
  LODGING: { label: "Hospedagem", icon: Bed },
  TRANSPORT: { label: "Transporte", icon: Bus },
  ACTIVITY: { label: "Atividade", icon: Ticket },
  OTHER: { label: "Outro", icon: Briefcase },
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

export function tripDurationDays(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseTripDate(endDate), parseTripDate(startDate)) + 1;
}

export function formatTripDuration(startDate: string, endDate: string): string {
  const days = tripDurationDays(startDate, endDate);
  return days === 1 ? "1 dia" : `${days} dias`;
}

export function formatDueDate(value: string): string {
  return format(parseTripDate(value), "d 'de' MMM", { locale: ptBR });
}

export function formatItineraryDayLabel(value: string): string {
  return format(parseTripDate(value), "EEEE, d 'de' MMMM", { locale: ptBR });
}

/**
 * `startAt`/`endAt` são naive (sem fuso), então a leitura não pode passar por
 * conversão de timezone — o voo das 14:30 tem que ler 14:30 em qualquer lugar.
 */
export function formatReservationMoment(value: string): string {
  const [datePart, timePart] = value.split("T");
  if (datePart === undefined || timePart === undefined) return value;
  const label = format(parseTripDate(datePart), "d 'de' MMM", { locale: ptBR });
  return `${label} às ${timePart}`;
}

export function formatReservationWindow(
  startAt: string | null,
  endAt: string | null,
): string | null {
  if (startAt === null && endAt === null) return null;
  if (startAt !== null && endAt === null) return formatReservationMoment(startAt);
  if (startAt === null && endAt !== null) {
    return `até ${formatReservationMoment(endAt)}`;
  }
  return `${formatReservationMoment(startAt as string)} → ${formatReservationMoment(endAt as string)}`;
}

export type TripPhase = {
  readonly label: string;
  readonly toneClass: string;
  readonly badgeClass: string;
};

/**
 * A fase sai das datas em vez de um campo de status, que ficaria desatualizado
 * sem alguém marcar a mudança.
 *
 * A proximidade é comunicada por brilho, não por matiz: no contexto de viagens
 * o âmbar é a cor de acento do app e o vermelho significa atraso, então usá-los
 * aqui faria a fase ser lida como alerta. Sobra o verde para "acontecendo
 * agora", que é o único estado realmente diferente dos outros.
 */
export function getTripPhase(startDate: string, endDate: string): TripPhase {
  const today = new Date();
  const daysToStart = differenceInCalendarDays(parseTripDate(startDate), today);
  const daysToEnd = differenceInCalendarDays(parseTripDate(endDate), today);

  if (daysToEnd < 0) {
    return {
      label: "Concluída",
      toneClass: "text-ink-faint",
      badgeClass: "bg-white/85 text-ink-muted",
    };
  }
  if (daysToStart <= 0) {
    return {
      label: "Em andamento",
      toneClass: "text-emerald-700",
      badgeClass: "bg-emerald-100 text-emerald-800",
    };
  }
  if (daysToStart === 1) {
    return {
      label: "Amanhã",
      toneClass: "text-ink",
      badgeClass: "bg-white/90 text-amber-950",
    };
  }
  return {
    label: `Em ${daysToStart} dias`,
    toneClass: "text-ink-muted",
    badgeClass: "bg-white/90 text-amber-950",
  };
}

/** Faixas de pôr do sol para o hero do card — Decolar/Duolingo, sem foto. */
const DESTINATION_WASHES = [
  "bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400",
  "bg-gradient-to-br from-sky-400 via-cyan-400 to-teal-500",
  "bg-gradient-to-br from-violet-400 via-fuchsia-400 to-rose-400",
  "bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500",
] as const;

export function destinationWashClass(destination: string): string {
  const sum = [...destination].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DESTINATION_WASHES[sum % DESTINATION_WASHES.length] ?? DESTINATION_WASHES[0];
}

export function progressPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
