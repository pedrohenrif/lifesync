import { useState, type FormEvent, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { AppModalShell } from "../ui/AppModalShell";
import type { AddItineraryItemInput, ItineraryItem } from "../../api/trips";

type ItineraryFormModalProps = {
  readonly item: ItineraryItem | null;
  /** Data pré-preenchida ao adicionar direto em um dia da lista. */
  readonly defaultDate: string;
  readonly pending: boolean;
  readonly onSubmit: (input: AddItineraryItemInput) => void;
  readonly onClose: () => void;
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ItineraryFormModal({
  item,
  defaultDate,
  pending,
  onSubmit,
  onClose,
}: ItineraryFormModalProps): ReactElement {
  const [date, setDate] = useState(item?.date ?? defaultDate);
  const [time, setTime] = useState(item?.time ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formEvent: FormEvent): void => {
    formEvent.preventDefault();

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setError("Escreva o que vai acontecer.");
      return;
    }
    if (date.length === 0) {
      setError("Escolha o dia.");
      return;
    }

    setError(null);
    onSubmit({
      date,
      time: time.length > 0 ? time : null,
      title: trimmedTitle,
      description: toNullable(description),
      location: toNullable(location),
    });
  };

  return (
    <AppModalShell
      title={item === null ? "Adicionar ao roteiro" : "Editar item do roteiro"}
      onClose={onClose}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="itin-title" className="mb-1.5 block text-xs font-medium text-ink-muted">
            O que vai acontecer
          </label>
          <input
            id="itin-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Trilha da Lagoinha do Leste"
            className="ls-input"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="itin-date" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Dia
            </label>
            <input
              id="itin-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="ls-input"
            />
          </div>
          <div>
            <label htmlFor="itin-time" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Hora <span className="text-ink-faint">(opcional)</span>
            </label>
            <input
              id="itin-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="ls-input"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="itin-location"
            className="mb-1.5 block text-xs font-medium text-ink-muted"
          >
            Onde <span className="text-ink-faint">(opcional)</span>
          </label>
          <input
            id="itin-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Praia do Matadeiro"
            className="ls-input"
          />
        </div>

        <div>
          <label
            htmlFor="itin-description"
            className="mb-1.5 block text-xs font-medium text-ink-muted"
          >
            Detalhes <span className="text-ink-faint">(opcional)</span>
          </label>
          <textarea
            id="itin-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Levar água, 3h de caminhada…"
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
            {item === null ? "Adicionar" : "Salvar"}
          </button>
        </div>
      </form>
    </AppModalShell>
  );
}
