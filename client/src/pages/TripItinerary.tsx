import { useMemo, useState, type ReactElement } from "react";
import { Clock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ItineraryFormModal } from "../components/trips/ItineraryFormModal";
import {
  useAddItineraryItem,
  useRemoveItineraryItem,
  useUpdateItineraryItem,
} from "../hooks/useTrips";
import { formatItineraryDayLabel, parseTripDate } from "../lib/tripMeta";
import type { ItineraryItem } from "../api/trips";
import { useTripContext } from "./TripLayout";

type DayGroup = {
  readonly date: string;
  readonly items: readonly ItineraryItem[];
};

/**
 * Agrupa por dia e ordena dentro do dia pela hora. Itens sem hora caem no fim
 * do dia, na ordem em que foram criados.
 */
function groupByDay(items: readonly ItineraryItem[]): readonly DayGroup[] {
  const byDate = new Map<string, ItineraryItem[]>();

  for (const item of items) {
    const bucket = byDate.get(item.date);
    if (bucket === undefined) byDate.set(item.date, [item]);
    else bucket.push(item);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => parseTripDate(a).getTime() - parseTripDate(b).getTime())
    .map(([date, dayItems]) => ({
      date,
      items: [...dayItems].sort((a, b) => {
        if (a.time === null && b.time === null) {
          return Date.parse(a.createdAt) - Date.parse(b.createdAt);
        }
        if (a.time === null) return 1;
        if (b.time === null) return -1;
        return a.time.localeCompare(b.time);
      }),
    }));
}

export function TripItinerary(): ReactElement {
  const { trip } = useTripContext();
  const addItem = useAddItineraryItem();
  const updateItem = useUpdateItineraryItem();
  const removeItem = useRemoveItineraryItem();

  const [creatingForDate, setCreatingForDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<ItineraryItem | null>(null);
  const [toDelete, setToDelete] = useState<ItineraryItem | null>(null);

  const days = useMemo(() => groupByDay(trip.itineraryItems), [trip.itineraryItems]);

  const handleDelete = (): void => {
    if (toDelete === null) return;
    removeItem.mutate(
      { tripId: trip.id, itemId: toDelete.id },
      { onSuccess: () => setToDelete(null) },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">
          {trip.itineraryTotal === 0
            ? "Roteiro vazio"
            : `${trip.itineraryTotal} ${trip.itineraryTotal === 1 ? "item" : "itens"} no roteiro`}
        </p>
        <button
          type="button"
          onClick={() => setCreatingForDate(trip.startDate)}
          className="ls-btn sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {days.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge px-6 py-10 text-center text-xs leading-relaxed text-ink-muted">
          Monte o roteiro dia por dia. Hora é opcional, então dá para só listar o que
          pretende fazer.
        </p>
      ) : (
        <div className="space-y-5">
          {days.map(({ date, items }) => (
            <section key={date}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  {formatItineraryDayLabel(date)}
                </h2>
                <button
                  type="button"
                  onClick={() => setCreatingForDate(date)}
                  className="rounded-md p-1 text-ink-faint transition hover:bg-surface-800 hover:text-ink"
                  aria-label={`Adicionar item em ${formatItineraryDayLabel(date)}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-2xl border border-edge/70 bg-surface-900 px-3 py-2.5"
                  >
                    <span className="mt-0.5 w-11 shrink-0 text-xs font-bold text-accent-700">
                      {item.time ?? (
                        <Clock className="h-3.5 w-3.5 text-ink-faint" aria-label="Sem hora" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{item.title}</p>
                      {item.location !== null && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-muted">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {item.location}
                        </p>
                      )}
                      {item.description !== null && (
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink-muted">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        className="rounded-md p-1.5 text-ink-faint transition hover:bg-surface-800 hover:text-ink"
                        aria-label={`Editar ${item.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(item)}
                        className="rounded-md p-1.5 text-ink-faint transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remover ${item.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {creatingForDate !== null && (
        <ItineraryFormModal
          item={null}
          defaultDate={creatingForDate}
          pending={addItem.isPending}
          onClose={() => setCreatingForDate(null)}
          onSubmit={(input) =>
            addItem.mutate(
              { tripId: trip.id, input },
              { onSuccess: () => setCreatingForDate(null) },
            )
          }
        />
      )}

      {editing !== null && (
        <ItineraryFormModal
          item={editing}
          defaultDate={editing.date}
          pending={updateItem.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(input) =>
            updateItem.mutate(
              { tripId: trip.id, itemId: editing.id, input },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      )}

      {toDelete !== null && (
        <ConfirmDialog
          title="Remover do roteiro"
          description={`"${toDelete.title}" será removido do roteiro.`}
          confirmLabel="Remover"
          danger
          pending={removeItem.isPending}
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
