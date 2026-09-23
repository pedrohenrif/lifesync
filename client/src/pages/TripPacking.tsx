import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  useAddPackingItem,
  useRemovePackingItem,
  useUpdatePackingItem,
} from "../hooks/useTrips";
import { PACKING_CATEGORY_META } from "../lib/tripMeta";
import { PACKING_CATEGORIES, type PackingCategory, type PackingItem } from "../api/trips";
import { useTripContext } from "./TripLayout";

type GroupedItems = ReadonlyArray<{
  readonly category: PackingCategory;
  readonly items: readonly PackingItem[];
}>;

function groupByCategory(items: readonly PackingItem[]): GroupedItems {
  return PACKING_CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}

export function TripPacking(): ReactElement {
  const { trip } = useTripContext();
  const addItem = useAddPackingItem();
  const updateItem = useUpdatePackingItem();
  const removeItem = useRemovePackingItem();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<PackingCategory>("ROUPA");
  const [quantity, setQuantity] = useState("1");

  const groups = useMemo(() => groupByCategory(trip.packingItems), [trip.packingItems]);

  const handleAdd = (formEvent: FormEvent): void => {
    formEvent.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    const parsedQuantity = Number.parseInt(quantity, 10);

    addItem.mutate(
      {
        tripId: trip.id,
        input: {
          name: trimmed,
          category,
          quantity: Number.isNaN(parsedQuantity) || parsedQuantity < 1 ? 1 : parsedQuantity,
        },
      },
      {
        onSuccess: () => {
          setName("");
          setQuantity("1");
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {trip.packingDone} de {trip.packingTotal} já na mala
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="space-y-2 rounded-xl border border-edge bg-surface-900/40 p-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="O que levar? Ex: carregador do celular"
          className="ls-input"
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PackingCategory)}
            className="ls-input min-w-0 flex-1"
            aria-label="Categoria"
          >
            {PACKING_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {PACKING_CATEGORY_META[value].label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={999}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="ls-input w-16 shrink-0 sm:w-20"
            aria-label="Quantidade"
          />
          <button
            type="submit"
            disabled={addItem.isPending || name.trim().length === 0}
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

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge px-6 py-10 text-center text-xs leading-relaxed text-zinc-500">
          A mala está vazia. Vá adicionando conforme se lembra — a lista fica salva.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map(({ category: groupCategory, items }) => {
            const meta = PACKING_CATEGORY_META[groupCategory];
            const Icon = meta.icon;

            return (
              <section key={groupCategory}>
                <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </h2>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-edge/70 bg-surface-900/40 px-3 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={item.isPacked}
                        onChange={(e) =>
                          updateItem.mutate({
                            tripId: trip.id,
                            itemId: item.id,
                            input: { isPacked: e.target.checked },
                          })
                        }
                        className="ls-checkbox h-5 w-5 shrink-0"
                        aria-label={`Marcar ${item.name}`}
                      />
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${
                          item.isPacked ? "text-zinc-600 line-through" : "text-zinc-200"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.quantity > 1 && (
                        <span className="shrink-0 rounded-md bg-surface-950/70 px-1.5 py-0.5 text-[10px] text-zinc-500">
                          {item.quantity}x
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          removeItem.mutate({ tripId: trip.id, itemId: item.id })
                        }
                        className="shrink-0 rounded-md p-1.5 text-zinc-700 transition hover:bg-red-950/40 hover:text-red-400"
                        aria-label={`Remover ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
