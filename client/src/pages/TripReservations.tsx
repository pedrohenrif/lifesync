import { useMemo, useState, type ReactElement } from "react";
import {
  CalendarClock,
  Copy,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ReservationFormModal } from "../components/trips/ReservationFormModal";
import {
  useAddReservation,
  useRemoveReservation,
  useUpdateReservation,
} from "../hooks/useTrips";
import { formatReservationWindow, RESERVATION_TYPE_META } from "../lib/tripMeta";
import type { Reservation } from "../api/trips";
import { useTripContext } from "./TripLayout";

/** Sem data vai para o fim; com data, a mais próxima primeiro. */
function sortReservations(items: readonly Reservation[]): readonly Reservation[] {
  return [...items].sort((a, b) => {
    if (a.startAt === null && b.startAt === null) return 0;
    if (a.startAt === null) return 1;
    if (b.startAt === null) return -1;
    return Date.parse(a.startAt) - Date.parse(b.startAt);
  });
}

function ReservationCard({
  reservation,
  onEdit,
  onDelete,
}: {
  readonly reservation: Reservation;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}): ReactElement {
  const meta = RESERVATION_TYPE_META[reservation.type];
  const Icon = meta.icon;
  const window = formatReservationWindow(reservation.startAt, reservation.endAt);

  const copyCode = (): void => {
    if (reservation.confirmationCode === null) return;
    void navigator.clipboard
      .writeText(reservation.confirmationCode)
      .then(() => toast.success("Código copiado."))
      .catch(() => toast.error("Não foi possível copiar."));
  };

  return (
    <div className="rounded-2xl border border-edge bg-surface-900 p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-600/15 text-accent-700">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{reservation.title}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
              {meta.label}
              {reservation.provider !== null && ` · ${reservation.provider}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1.5 text-ink-faint transition hover:bg-surface-800 hover:text-ink"
            aria-label={`Editar ${reservation.title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-ink-faint transition hover:bg-red-50 hover:text-red-600"
            aria-label={`Remover ${reservation.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 pl-11">
        {window !== null && (
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <CalendarClock className="h-3 w-3 shrink-0 text-ink-faint" />
            {window}
          </p>
        )}
        {reservation.address !== null && (
          <p className="flex items-start gap-1.5 text-xs text-ink-muted">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-ink-faint" />
            {reservation.address}
          </p>
        )}
        {reservation.confirmationCode !== null && (
          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-1.5 text-xs font-medium text-ink transition hover:text-accent-700"
          >
            <Copy className="h-3 w-3 shrink-0 text-ink-faint" />
            <span className="font-mono">{reservation.confirmationCode}</span>
          </button>
        )}
        {reservation.notes !== null && (
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink-muted">
            {reservation.notes}
          </p>
        )}
        {reservation.url !== null && (
          <a
            href={reservation.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-700 transition hover:text-accent-600"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir reserva
          </a>
        )}
      </div>
    </div>
  );
}

export function TripReservations(): ReactElement {
  const { trip } = useTripContext();
  const addReservation = useAddReservation();
  const updateReservation = useUpdateReservation();
  const removeReservation = useRemoveReservation();

  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [toDelete, setToDelete] = useState<Reservation | null>(null);

  const reservations = useMemo(() => sortReservations(trip.reservations), [trip.reservations]);

  const handleDelete = (): void => {
    if (toDelete === null) return;
    removeReservation.mutate(
      { tripId: trip.id, itemId: toDelete.id },
      { onSuccess: () => setToDelete(null) },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">
          {trip.reservationTotal === 0
            ? "Nenhuma reserva guardada"
            : `${trip.reservationTotal} ${trip.reservationTotal === 1 ? "reserva" : "reservas"}`}
        </p>
        <button type="button" onClick={() => setIsCreating(true)} className="ls-btn sm:w-auto">
          <Plus className="h-4 w-4" />
          Nova
        </button>
      </div>

      {reservations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge px-6 py-10 text-center text-xs leading-relaxed text-ink-muted">
          Guarde aqui voo, hotel e códigos de confirmação. Fica tudo junto para quando
          precisar no balcão.
        </p>
      ) : (
        <div className="space-y-2.5">
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onEdit={() => setEditing(reservation)}
              onDelete={() => setToDelete(reservation)}
            />
          ))}
        </div>
      )}

      {isCreating && (
        <ReservationFormModal
          reservation={null}
          pending={addReservation.isPending}
          onClose={() => setIsCreating(false)}
          onSubmit={(input) =>
            addReservation.mutate(
              { tripId: trip.id, input },
              { onSuccess: () => setIsCreating(false) },
            )
          }
        />
      )}

      {editing !== null && (
        <ReservationFormModal
          reservation={editing}
          pending={updateReservation.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(input) =>
            updateReservation.mutate(
              { tripId: trip.id, itemId: editing.id, input },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      )}

      {toDelete !== null && (
        <ConfirmDialog
          title="Remover reserva"
          description={`"${toDelete.title}" será apagada desta viagem.`}
          confirmLabel="Remover"
          danger
          pending={removeReservation.isPending}
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
