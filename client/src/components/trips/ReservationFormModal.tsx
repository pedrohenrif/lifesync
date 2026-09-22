import { useState, type FormEvent, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { AppModalShell } from "../ui/AppModalShell";
import { RESERVATION_TYPE_META } from "../../lib/tripMeta";
import {
  RESERVATION_TYPES,
  type AddReservationInput,
  type Reservation,
  type ReservationType,
} from "../../api/trips";

type ReservationFormModalProps = {
  readonly reservation: Reservation | null;
  readonly pending: boolean;
  readonly onSubmit: (input: AddReservationInput) => void;
  readonly onClose: () => void;
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ReservationFormModal({
  reservation,
  pending,
  onSubmit,
  onClose,
}: ReservationFormModalProps): ReactElement {
  const [type, setType] = useState<ReservationType>(reservation?.type ?? "FLIGHT");
  const [title, setTitle] = useState(reservation?.title ?? "");
  const [provider, setProvider] = useState(reservation?.provider ?? "");
  const [confirmationCode, setConfirmationCode] = useState(
    reservation?.confirmationCode ?? "",
  );
  const [url, setUrl] = useState(reservation?.url ?? "");
  const [startAt, setStartAt] = useState(reservation?.startAt ?? "");
  const [endAt, setEndAt] = useState(reservation?.endAt ?? "");
  const [address, setAddress] = useState(reservation?.address ?? "");
  const [notes, setNotes] = useState(reservation?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formEvent: FormEvent): void => {
    formEvent.preventDefault();

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setError("Dê um nome para a reserva.");
      return;
    }

    if (startAt.length > 0 && endAt.length > 0 && Date.parse(endAt) < Date.parse(startAt)) {
      setError("O fim da reserva precisa ser depois do início.");
      return;
    }

    const trimmedUrl = url.trim();
    if (trimmedUrl.length > 0 && !/^https?:\/\//i.test(trimmedUrl)) {
      setError("O link precisa começar com http:// ou https://");
      return;
    }

    setError(null);
    onSubmit({
      type,
      title: trimmedTitle,
      provider: toNullable(provider),
      confirmationCode: toNullable(confirmationCode),
      url: toNullable(url),
      startAt: startAt.length > 0 ? startAt : null,
      endAt: endAt.length > 0 ? endAt : null,
      address: toNullable(address),
      notes: toNullable(notes),
    });
  };

  return (
    <AppModalShell
      title={reservation === null ? "Nova reserva" : "Editar reserva"}
      onClose={onClose}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="res-type" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Tipo
          </label>
          <select
            id="res-type"
            value={type}
            onChange={(e) => setType(e.target.value as ReservationType)}
            className="ls-input"
          >
            {RESERVATION_TYPES.map((value) => (
              <option key={value} value={value}>
                {RESERVATION_TYPE_META[value].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="res-title" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Nome
          </label>
          <input
            id="res-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Voo GRU → FLN"
            className="ls-input"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="res-provider"
              className="mb-1.5 block text-xs font-medium text-zinc-400"
            >
              Empresa <span className="text-zinc-600">(opcional)</span>
            </label>
            <input
              id="res-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="LATAM, Booking…"
              className="ls-input"
            />
          </div>
          <div>
            <label htmlFor="res-code" className="mb-1.5 block text-xs font-medium text-zinc-400">
              Código <span className="text-zinc-600">(opcional)</span>
            </label>
            <input
              id="res-code"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder="ABC123"
              className="ls-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="res-start" className="mb-1.5 block text-xs font-medium text-zinc-400">
              Início <span className="text-zinc-600">(opcional)</span>
            </label>
            <input
              id="res-start"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="ls-input"
            />
          </div>
          <div>
            <label htmlFor="res-end" className="mb-1.5 block text-xs font-medium text-zinc-400">
              Fim <span className="text-zinc-600">(opcional)</span>
            </label>
            <input
              id="res-end"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="ls-input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="res-address" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Endereço <span className="text-zinc-600">(opcional)</span>
          </label>
          <input
            id="res-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua, número, cidade"
            className="ls-input"
          />
        </div>

        <div>
          <label htmlFor="res-url" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Link <span className="text-zinc-600">(opcional)</span>
          </label>
          <input
            id="res-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="ls-input"
          />
        </div>

        <div>
          <label htmlFor="res-notes" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Observações <span className="text-zinc-600">(opcional)</span>
          </label>
          <textarea
            id="res-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="ls-input resize-none"
          />
        </div>

        {error !== null && (
          <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="min-h-11 rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="ls-btn">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {reservation === null ? "Salvar reserva" : "Salvar"}
          </button>
        </div>
      </form>
    </AppModalShell>
  );
}
