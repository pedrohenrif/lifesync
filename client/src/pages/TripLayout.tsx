import { useState, type ReactElement } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  CalendarRange,
  Loader2,
  ListChecks,
  Luggage,
  Pencil,
  Ticket,
} from "lucide-react";
import { TripFormModal } from "../components/trips/TripFormModal";
import { useTrip, useUpdateTrip } from "../hooks/useTrips";
import {
  destinationWashClass,
  formatTripDuration,
  formatTripRange,
  getTripPhase,
} from "../lib/tripMeta";
import type { Trip } from "../api/trips";

type TripContext = {
  readonly trip: Trip;
};

export function useTripContext(): TripContext {
  return useOutletContext<TripContext>();
}

const SECTIONS = [
  { path: "bagagem", label: "Bagagem", icon: Luggage },
  { path: "pendencias", label: "Pendências", icon: ListChecks },
  { path: "reservas", label: "Reservas", icon: Ticket },
  { path: "roteiro", label: "Roteiro", icon: CalendarRange },
] as const;

export function TripLayout(): ReactElement {
  const { tripId } = useParams<{ tripId: string }>();
  const tripQuery = useTrip(tripId);
  const updateTrip = useUpdateTrip();
  const [isEditing, setIsEditing] = useState(false);

  if (tripQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (tripQuery.isError || tripQuery.data === undefined) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-sm font-bold text-ink">Viagem não encontrada</p>
        <p className="mt-1 text-xs text-ink-muted">
          Ela pode ter sido removida em outro dispositivo.
        </p>
        <Link
          to="/viagens"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent-700 hover:text-accent-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para as viagens
        </Link>
      </div>
    );
  }

  const trip = tripQuery.data;
  const phase = getTripPhase(trip.startDate, trip.endDate);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/viagens"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Viagens
      </Link>

      <div className="ls-card overflow-hidden">
        <div className={`relative px-5 py-6 ${destinationWashClass(trip.destination)}`}>
          <p className="truncate text-2xl font-extrabold tracking-tight text-white">
            {trip.destination}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-white/85">{trip.name}</p>
          <span
            className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold ${phase.badgeClass}`}
          >
            {phase.label}
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="absolute bottom-4 right-4 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Editar viagem"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-3 text-sm font-medium text-ink-muted">
          {formatTripRange(trip.startDate, trip.endDate)}
          <span className="mx-1.5 text-ink-faint">·</span>
          {formatTripDuration(trip.startDate, trip.endDate)}
        </div>
        {trip.notes !== null && (
          <p className="border-t border-edge/70 px-5 py-3 text-xs leading-relaxed text-ink-muted">
            {trip.notes}
          </p>
        )}
      </div>

      <div className="-mx-4 flex gap-1 overflow-x-auto overscroll-x-contain border-b border-edge px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        {SECTIONS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={`/viagens/${trip.id}/${path}`}
            className={({ isActive }) =>
              `flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition ${
                isActive
                  ? "border-accent-600 text-accent-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ trip } satisfies TripContext} />

      {isEditing && (
        <TripFormModal
          trip={trip}
          pending={updateTrip.isPending}
          onClose={() => setIsEditing(false)}
          onSubmit={(input) =>
            updateTrip.mutate(
              { tripId: trip.id, input },
              { onSuccess: () => setIsEditing(false) },
            )
          }
        />
      )}
    </div>
  );
}
