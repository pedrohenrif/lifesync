import { useState, type FormEvent, type ReactElement } from "react";
import { addDays, format } from "date-fns";
import { Loader2 } from "lucide-react";
import { AppModalShell } from "../ui/AppModalShell";
import type { CreateTripInput, TripSummary } from "../../api/trips";

type TripFormModalProps = {
  readonly trip: TripSummary | null;
  readonly pending: boolean;
  readonly onSubmit: (input: CreateTripInput) => void;
  readonly onClose: () => void;
};

function defaultStart(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function defaultEnd(): string {
  return format(addDays(new Date(), 7), "yyyy-MM-dd");
}

export function TripFormModal({
  trip,
  pending,
  onSubmit,
  onClose,
}: TripFormModalProps): ReactElement {
  const [name, setName] = useState(trip?.name ?? "");
  const [destination, setDestination] = useState(trip?.destination ?? "");
  const [startDate, setStartDate] = useState(trip?.startDate ?? defaultStart());
  const [endDate, setEndDate] = useState(trip?.endDate ?? defaultEnd());
  const [notes, setNotes] = useState(trip?.notes ?? "");
  const [budget, setBudget] = useState(
    trip?.budgetAmount !== null && trip?.budgetAmount !== undefined
      ? String(trip.budgetAmount)
      : "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formEvent: FormEvent): void => {
    formEvent.preventDefault();

    const trimmedName = name.trim();
    const trimmedDestination = destination.trim();

    if (trimmedName.length === 0) {
      setError("Dê um nome para a viagem.");
      return;
    }
    if (trimmedDestination.length === 0) {
      setError("Informe o destino.");
      return;
    }
    if (Date.parse(endDate) < Date.parse(startDate)) {
      setError("A volta precisa ser depois da ida.");
      return;
    }

    const trimmedBudget = budget.trim().replace(",", ".");
    const parsedBudget =
      trimmedBudget.length === 0 ? null : Number.parseFloat(trimmedBudget);
    if (parsedBudget !== null && (!Number.isFinite(parsedBudget) || parsedBudget <= 0)) {
      setError("Informe um orçamento maior que zero.");
      return;
    }

    setError(null);
    onSubmit({
      name: trimmedName,
      destination: trimmedDestination,
      startDate,
      endDate,
      notes: notes.trim().length > 0 ? notes.trim() : null,
      budgetAmount: parsedBudget,
    });
  };

  return (
    <AppModalShell
      title={trip === null ? "Nova viagem" : "Editar viagem"}
      onClose={onClose}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="trip-name" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Nome
          </label>
          <input
            id="trip-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Férias de setembro"
            className="ls-input"
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="trip-destination"
            className="mb-1.5 block text-xs font-medium text-ink-muted"
          >
            Destino
          </label>
          <input
            id="trip-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Florianópolis, SC"
            className="ls-input"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="trip-start"
              className="mb-1.5 block text-xs font-medium text-ink-muted"
            >
              Ida
            </label>
            <input
              id="trip-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="ls-input"
            />
          </div>
          <div>
            <label htmlFor="trip-end" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Volta
            </label>
            <input
              id="trip-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="ls-input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="trip-budget" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Orçamento <span className="text-ink-faint">(opcional, R$)</span>
          </label>
          <input
            id="trip-budget"
            type="number"
            min={1}
            step="0.01"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="4000"
            className="ls-input"
          />
        </div>

        <div>
          <label htmlFor="trip-notes" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Observações <span className="text-ink-faint">(opcional)</span>
          </label>
          <textarea
            id="trip-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Voo, hospedagem, quem vai…"
            className="ls-input resize-none"
          />
        </div>

        {error !== null && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="min-h-11 rounded-2xl border border-edge px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="ls-btn">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {trip === null ? "Criar viagem" : "Salvar"}
          </button>
        </div>
      </form>
    </AppModalShell>
  );
}
