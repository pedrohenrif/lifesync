import { useState, type ReactElement } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { ArrowLeft, Loader2, ListChecks, Luggage, MapPin, Pencil } from "lucide-react";
import { TripFormModal } from "../components/trips/TripFormModal";
import { useTrip, useUpdateTrip } from "../hooks/useTrips";
import { formatTripRange, getTripPhase } from "../lib/tripMeta";
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
] as const;

export function TripLayout(): ReactElement {
  const { tripId } = useParams<{ tripId: string }>();
  const tripQuery = useTrip(tripId);
  const updateTrip = useUpdateTrip();
  const [isEditing, setIsEditing] = useState(false);

  if (tripQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (tripQuery.isError || tripQuery.data === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
        <p className="text-sm font-medium text-zinc-300">Viagem não encontrada</p>
        <p className="mt-1 text-xs text-zinc-500">
          Ela pode ter sido removida em outro dispositivo.
        </p>
        <Link
          to="/viagens"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
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
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <Link
          to="/viagens"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Viagens
        </Link>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-zinc-100">{trip.name}</h1>
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-zinc-500">
              <MapPin className="h-3 w-3 shrink-0" />
              {trip.destination}
            </p>
            <p className="mt-1.5 text-xs text-zinc-600">
              {formatTripRange(trip.startDate, trip.endDate)}
              <span className={`ml-2 font-medium ${phase.toneClass}`}>{phase.label}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="shrink-0 rounded-md p-2 text-zinc-600 transition hover:bg-navy-800 hover:text-zinc-300"
            aria-label="Editar viagem"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {trip.notes !== null && (
          <p className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-800/70 bg-navy-900/40 px-3 py-2 text-xs leading-relaxed text-zinc-400">
            {trip.notes}
          </p>
        )}
      </div>

      {/* Abas da viagem: a barra global só sabe em qual viagem você está. */}
      <div className="flex gap-1 border-b border-slate-800">
        {SECTIONS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={`/viagens/${trip.id}/${path}`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition ${
                isActive
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
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
