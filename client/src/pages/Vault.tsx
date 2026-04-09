import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import {
  BookMarked,
  Plus,
  X,
  FileText,
  ExternalLink,
  Target,
  Trash2,
} from "lucide-react";
import type { VaultNote, NoteType } from "../api/vault";
import { useNotes, useCreateNote, useDeleteNote } from "../hooks/useVault";
import { useGoals } from "../hooks/useGoals";

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-100 focus:bg-zinc-900";

/* ─── Modal de Criação ─── */

function CreateNoteModal({ onClose }: { readonly onClose: () => void }): ReactElement {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<NoteType>("NOTE");
  const [goalId, setGoalId] = useState("");
  const createNote = useCreateNote();

  const { data: goalsData } = useGoals();
  const activeGoals = (goalsData?.goals ?? []).filter(
    (g) => g.status === "PENDING" || g.status === "IN_PROGRESS",
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (title.trim().length === 0 || content.trim().length === 0) return;

    createNote.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        type,
        goalId: goalId.length > 0 ? goalId : undefined,
      },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
          setGoalId("");
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="max-h-[min(90vh,100dvh)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-zinc-800 border-b-0 bg-zinc-950 p-4 sm:rounded-xl sm:border-b md:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">Nova Nota</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className={INPUT_CLASS}
            required
            autoFocus
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("NOTE")}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                type === "NOTE"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Anotação
            </button>
            <button
              type="button"
              onClick={() => setType("LINK")}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                type === "LINK"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Link
            </button>
          </div>

          {type === "LINK" ? (
            <input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://..."
              className={INPUT_CLASS}
              required
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Conteúdo da anotação..."
              rows={4}
              className={`${INPUT_CLASS} resize-none`}
              required
            />
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Vincular a uma meta (opcional)
            </label>
            <select
              className={INPUT_CLASS}
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
            >
              <option value="">Sem vínculo</option>
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded-lg border border-zinc-800 py-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createNote.isPending || title.trim().length === 0 || content.trim().length === 0}
              className="min-h-11 flex-1 rounded-lg bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createNote.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Card de Nota ─── */

function NoteCard({
  note,
  goalTitle,
}: {
  readonly note: VaultNote;
  readonly goalTitle: string | null;
}): ReactElement {
  const deleteMutation = useDeleteNote();

  const handleDelete = (): void => {
    if (window.confirm("Excluir esta nota do cofre?")) {
      deleteMutation.mutate(note.id);
    }
  };

  const isLink = note.type === "LINK";
  const Icon = isLink ? ExternalLink : FileText;
  const iconColor = isLink ? "text-blue-400" : "text-violet-400";

  return (
    <div className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 p-3 transition hover:border-zinc-700 md:p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
          <h3 className="truncate text-sm font-medium text-zinc-100">{note.title}</h3>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="shrink-0 rounded-md p-1 text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400 disabled:opacity-50"
          aria-label="Excluir nota"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      {isLink ? (
        <a
          href={note.content}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 truncate text-xs text-blue-400/80 underline decoration-blue-400/30 transition hover:text-blue-300"
        >
          {note.content}
        </a>
      ) : (
        <p className="mb-2 line-clamp-4 text-xs leading-relaxed text-zinc-500">
          {note.content}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-800/50">
        <span className="text-[10px] text-zinc-700">
          {new Date(note.createdAt).toLocaleDateString("pt-BR")}
        </span>
        {goalTitle !== null && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <Target className="h-2.5 w-2.5" />
            {goalTitle}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Página Principal do Cofre ─── */

export function Vault(): ReactElement {
  const [showModal, setShowModal] = useState(false);
  const { data, isPending, isError } = useNotes();
  const { data: goalsData } = useGoals();

  const notes = data?.notes ?? [];
  const goalsMap = new Map(
    (goalsData?.goals ?? []).map((g) => [g.id, g.title]),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BookMarked className="h-6 w-6 shrink-0 text-zinc-400" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Cofre</h1>
            <p className="text-xs text-zinc-600">Seu segundo cérebro</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nova Nota
        </button>
      </div>

      {showModal && <CreateNoteModal onClose={() => setShowModal(false)} />}

      {/* Content */}
      {isPending ? (
        <div className="flex justify-center py-16">
          <div className="flex items-center gap-3 text-zinc-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
            <span className="text-sm">Carregando cofre...</span>
          </div>
        </div>
      ) : isError ? (
        <p className="py-16 text-center text-sm text-red-400/90">
          Erro ao carregar notas. Tente recarregar a página.
        </p>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookMarked className="mb-3 h-10 w-10 text-zinc-800" />
          <p className="text-sm text-zinc-600">Seu cofre está vazio.</p>
          <p className="text-xs text-zinc-700 mt-1">
            Adicione notas, links e conecte-os às suas metas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              goalTitle={note.goalId !== null ? (goalsMap.get(note.goalId) ?? null) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
