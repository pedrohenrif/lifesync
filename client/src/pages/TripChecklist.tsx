import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import {
  useAddChecklistItem,
  useRemoveChecklistItem,
  useUpdateChecklistItem,
} from "../hooks/useTrips";
import { formatDueDate, parseTripDate } from "../lib/tripMeta";
import type { ChecklistItem } from "../api/trips";
import { useTripContext } from "./TripLayout";

/** Pendências sem prazo vão para o fim; entre as com prazo, a mais próxima primeiro. */
function sortByDueDate(items: readonly ChecklistItem[]): readonly ChecklistItem[] {
  return [...items].sort((a, b) => {
    if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
    if (a.dueDate === null && b.dueDate === null) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return parseTripDate(a.dueDate).getTime() - parseTripDate(b.dueDate).getTime();
  });
}

function isOverdue(item: ChecklistItem): boolean {
  if (item.isDone || item.dueDate === null) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseTripDate(item.dueDate).getTime() < today.getTime();
}

export function TripChecklist(): ReactElement {
  const { trip } = useTripContext();
  const addItem = useAddChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const removeItem = useRemoveChecklistItem();

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const items = useMemo(() => sortByDueDate(trip.checklistItems), [trip.checklistItems]);

  const handleAdd = (formEvent: FormEvent): void => {
    formEvent.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length === 0) return;

    addItem.mutate(
      {
        tripId: trip.id,
        input: { title: trimmed, dueDate: dueDate.length > 0 ? dueDate : null },
      },
      {
        onSuccess: () => {
          setTitle("");
          setDueDate("");
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-zinc-500">
        {trip.checklistDone} de {trip.checklistTotal} resolvidas
      </p>

      <form
        onSubmit={handleAdd}
        className="space-y-2 rounded-xl border border-edge bg-surface-900/40 p-3"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="O que resolver antes de sair? Ex: avisar o banco"
          className="ls-input"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="ls-input min-w-0 flex-1"
            aria-label="Prazo (opcional)"
          />
          <button
            type="submit"
            disabled={addItem.isPending || title.trim().length === 0}
            className="ls-btn !w-auto shrink-0 px-3"
          >
            {addItem.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge px-6 py-10 text-center text-xs leading-relaxed text-zinc-500">
          Nenhuma pendência. Documento, câmbio, seguro e check-in costumam entrar aqui.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-edge/70 bg-surface-900/40 px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={item.isDone}
                onChange={(e) =>
                  updateItem.mutate({
                    tripId: trip.id,
                    itemId: item.id,
                    input: { isDone: e.target.checked },
                  })
                }
                className="ls-checkbox h-5 w-5 shrink-0"
                aria-label={`Marcar ${item.title}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${
                    item.isDone ? "text-zinc-600 line-through" : "text-zinc-200"
                  }`}
                >
                  {item.title}
                </p>
                {item.dueDate !== null && (
                  <p
                    className={`mt-0.5 flex items-center gap-1 text-[10px] ${
                      isOverdue(item) ? "text-red-400" : "text-zinc-600"
                    }`}
                  >
                    <CalendarClock className="h-3 w-3" />
                    {formatDueDate(item.dueDate)}
                    {isOverdue(item) && " · atrasada"}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem.mutate({ tripId: trip.id, itemId: item.id })}
                className="shrink-0 rounded-md p-1.5 text-zinc-700 transition hover:bg-red-950/40 hover:text-red-400"
                aria-label={`Remover ${item.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
