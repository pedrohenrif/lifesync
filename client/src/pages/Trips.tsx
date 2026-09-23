import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Archive, ArchiveRestore, Calendar, Loader2, Plane, Plus, Trash2 } from "lucide-react";
import { LoadMoreButton } from "../components/ui/LoadMoreButton";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { TripFormModal } from "../components/trips/TripFormModal";
import { useCreateTrip, useDeleteTrip, useTrips, useUpdateTrip } from "../hooks/useTrips";
import {
  destinationWashClass,
  formatTripDuration,
  formatTripRange,
  getTripPhase,
  progressPercent,
} from "../lib/tripMeta";
import type { TripSummary } from "../api/trips";

function ProgressRow({
  label,
  done,
  total,
}: {
  readonly label: string;
  readonly done: number;
  readonly total: number;
}): ReactElement {
  const percent = progressPercent(done, total);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="text-ink-muted">{label}</span>
        <span className="tabular-nums text-ink">
          {done}/{total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-800">
        <div
          className="h-full rounded-full bg-accent-600 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
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
    <article className="ls-card overflow-hidden">
      <Link to={`/viagens/${trip.id}/bagagem`} className="block">
        <div className={`relative px-5 py-6 ${destinationWashClass(trip.destination)}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
            Destino
          </p>
          <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-white">
            {trip.destination}
          </p>
          <span
            className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold ${phase.badgeClass}`}
          >
            {phase.label}
          </span>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <p className="truncate text-base font-bold text-ink">{trip.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatTripRange(trip.startDate, trip.endDate)}
              <span className="text-ink-faint">·</span>
              {formatTripDuration(trip.startDate, trip.endDate)}
            </p>
          </div>
          <ProgressRow label="Bagagem" done={trip.packingDone} total={trip.packingTotal} />
          <ProgressRow
            label="Pendências"
            done={trip.checklistDone}
            total={trip.checklistTotal}
          />
        </div>
      </Link>

      <div className="flex justify-end gap-1 border-t border-edge/70 px-3 py-1.5">
        <button
          type="button"
          onClick={onArchiveToggle}
          className="rounded-xl p-2 text-ink-faint transition hover:bg-surface-800 hover:text-ink"
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
          className="rounded-xl p-2 text-ink-faint transition hover:bg-red-50 hover:text-red-600"
          aria-label="Remover viagem"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Minhas viagens</h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            Uma mala, um roteiro e as reservas — tudo no mesmo lugar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="ls-btn sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nova viagem
        </button>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-ink-muted">
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
          <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
        </div>
      ) : items.length === 0 ? (
        <div className="ls-card px-6 py-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-600/15">
            <Plane className="h-7 w-7 text-accent-600" />
          </span>
          <p className="mt-4 text-base font-bold text-ink">Para onde vamos?</p>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-ink-muted">
            Crie a primeira viagem e monte bagagem, pendências e reservas antes de sair.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
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
