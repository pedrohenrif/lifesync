import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Archive, ArchiveRestore, Loader2, MapPin, Plane, Plus, Trash2 } from "lucide-react";
import { LoadMoreButton } from "../components/ui/LoadMoreButton";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { TripFormModal } from "../components/trips/TripFormModal";
import { useCreateTrip, useDeleteTrip, useTrips, useUpdateTrip } from "../hooks/useTrips";
import { formatTripRange, getTripPhase } from "../lib/tripMeta";
import type { TripSummary } from "../api/trips";

function ProgressPill({
  label,
  done,
  total,
}: {
  readonly label: string;
  readonly done: number;
  readonly total: number;
}): ReactElement {
  const isComplete = total > 0 && done === total;

  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
        isComplete
          ? "bg-emerald-950/40 text-emerald-400"
          : "bg-surface-950/70 text-zinc-500"
      }`}
    >
      {label} {done}/{total}
    </span>
  );
}

function TripCard({
  trip,
  onArchiveToggle,
  onDelete,
}: {
  readonly trip: TripSummary;
  readonly onArchiveToggle: () => void;
  readonly onDelete: () => void;
}): ReactElement {
  const phase = getTripPhase(trip.startDate, trip.endDate);

  return (
    <div className="rounded-xl border border-edge bg-surface-900/60 transition hover:border-accent-900/60">
      <Link to={`/viagens/${trip.id}/bagagem`} className="block p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">{trip.name}</p>
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-zinc-500">
              <MapPin className="h-3 w-3 shrink-0" />
              {trip.destination}
            </p>
          </div>
          <span className={`shrink-0 text-[10px] font-medium ${phase.toneClass}`}>
            {phase.label}
          </span>
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          {formatTripRange(trip.startDate, trip.endDate)}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <ProgressPill label="Bagagem" done={trip.packingDone} total={trip.packingTotal} />
          <ProgressPill
            label="Pendências"
            done={trip.checklistDone}
            total={trip.checklistTotal}
          />
        </div>
      </Link>

      <div className="flex justify-end gap-1 border-t border-edge/70 px-2 py-1.5">
        <button
          type="button"
          onClick={onArchiveToggle}
          className="rounded-md p-2 text-zinc-600 transition hover:bg-surface-800 hover:text-zinc-300"
          aria-label={trip.isArchived ? "Desarquivar viagem" : "Arquivar viagem"}
        >
          {trip.isArchived ? (
            <ArchiveRestore className="h-4 w-4" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-2 text-zinc-600 transition hover:bg-red-950/40 hover:text-red-400"
          aria-label="Remover viagem"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Trips(): ReactElement {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<TripSummary | null>(null);

  const { items, total, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useTrips(includeArchived);
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();

  const handleDelete = (): void => {
    if (tripToDelete === null) return;
    deleteTrip.mutate(tripToDelete.id, {
      onSuccess: () => setTripToDelete(null),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-zinc-100">Minhas viagens</h1>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Cada viagem tem a própria lista de bagagem e de pendências.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="ls-btn sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nova
        </button>
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-500">
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={(e) => setIncludeArchived(e.target.checked)}
          className="ls-checkbox h-4 w-4"
        />
        Mostrar viagens arquivadas
      </label>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-edge px-6 py-12 text-center">
          <Plane className="mx-auto h-8 w-8 text-zinc-700" />
          <p className="mt-3 text-sm font-medium text-zinc-300">
            Nenhuma viagem por aqui
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
            Crie a primeira e monte a lista do que levar antes de sair.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onArchiveToggle={() =>
                  updateTrip.mutate({
                    tripId: trip.id,
                    input: { isArchived: !trip.isArchived },
                  })
                }
                onDelete={() => setTripToDelete(trip)}
              />
            ))}
          </div>

          <LoadMoreButton
            hasMore={hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
            loadedCount={items.length}
            total={total}
            label="Carregar mais viagens"
          />
        </>
      )}

      {isFormOpen && (
        <TripFormModal
          trip={null}
          pending={createTrip.isPending}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(input) =>
            createTrip.mutate(input, { onSuccess: () => setIsFormOpen(false) })
          }
        />
      )}

      {tripToDelete !== null && (
        <ConfirmDialog
          title="Remover viagem"
          description={`"${tripToDelete.name}" e tudo que está nela serão apagados. Isso não tem volta.`}
          confirmLabel="Remover"
          danger
          pending={deleteTrip.isPending}
          onConfirm={handleDelete}
          onClose={() => setTripToDelete(null)}
        />
      )}
    </div>
  );
}
