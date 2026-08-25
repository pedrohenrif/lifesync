import type { FormEvent, ReactElement } from "react";
import { useMemo, useState } from "react";
import {
  BookMarked,
  Plus,
  Target,
  Trash2,
  Search,
  Star,
  Pencil,
  Archive,
  ArchiveRestore,
  X,
  Sparkles,
  Loader2,
  Lightbulb,
} from "lucide-react";
import type {
  VaultNote,
  NoteType,
  NoteCategory,
  NoteStage,
  VaultFilter,
} from "../api/vault";
import { NOTE_CATEGORIES, NOTE_STAGES, NOTE_TYPES } from "../api/vault";
import type { GoalStatus } from "../api/goals";
import {
  useNotes,
  useVaultTags,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "../hooks/useVault";
import { useGoals } from "../hooks/useGoals";
import { useAiUsage, useSuggestNoteMetadata } from "../hooks/useAi";
import { AppModalShell } from "../components/ui/AppModalShell";
import { LoadMoreButton } from "../components/ui/LoadMoreButton";
import { TagInput } from "../components/vault/TagInput";
import { CATEGORY_META, STAGE_META, TYPE_META } from "../lib/vaultMeta";

const INPUT_CLASS = "ls-input";

const ACTIVE_GOAL_STATUSES: readonly GoalStatus[] = ["PENDING", "IN_PROGRESS"];

/** Metas carregadas para o select de vínculo e para resolver o nome no card. */
const GOAL_SELECT_PAGE_SIZE = 100;
const NOTES_PAGE_SIZE = 24;

/* ─── Formulário compartilhado (criação e edição) ─── */

type NoteFormState = {
  readonly title: string;
  readonly content: string;
  readonly summary: string;
  readonly type: NoteType;
  readonly category: NoteCategory;
  readonly stage: NoteStage;
  readonly tags: readonly string[];
  readonly sourceUrl: string;
  readonly goalId: string;
};

function emptyForm(): NoteFormState {
  return {
    title: "",
    content: "",
    summary: "",
    type: "NOTE",
    category: "IDEA",
    stage: "SEED",
    tags: [],
    sourceUrl: "",
    goalId: "",
  };
}

function formFromNote(note: VaultNote): NoteFormState {
  return {
    title: note.title,
    content: note.content,
    summary: note.summary ?? "",
    type: note.type,
    category: note.category,
    stage: note.stage,
    tags: note.tags,
    sourceUrl: note.sourceUrl ?? "",
    goalId: note.goalId ?? "",
  };
}

function NoteFormModal({
  note,
  onClose,
}: {
  readonly note: VaultNote | null;
  readonly onClose: () => void;
}): ReactElement {
  const isEditing = note !== null;
  const [form, setForm] = useState<NoteFormState>(() =>
    note !== null ? formFromNote(note) : emptyForm(),
  );

  const [aiQuestions, setAiQuestions] = useState<readonly string[]>([]);

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const isPending = createNote.isPending || updateNote.isPending;

  const { items: activeGoals } = useGoals({
    statuses: ACTIVE_GOAL_STATUSES,
    pageSize: GOAL_SELECT_PAGE_SIZE,
  });
  const { data: tagsData } = useVaultTags();
  const tagSuggestions = (tagsData?.tags ?? []).map((t) => t.tag);

  const { data: aiUsage } = useAiUsage();
  const suggestMetadata = useSuggestNoteMetadata();
  const canSuggest =
    aiUsage?.enabled === true &&
    form.title.trim().length > 0 &&
    form.content.trim().length > 0;

  const patch = <K extends keyof NoteFormState>(key: K, value: NoteFormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // A IA preenche os metadados e propõe perguntas; o texto do usuário nunca é sobrescrito.
  const handleSuggest = (): void => {
    suggestMetadata.mutate(
      {
        title: form.title.trim(),
        content: form.content.trim(),
        existingTags: tagSuggestions,
      },
      {
        onSuccess: ({ suggestion }) => {
          setForm((prev) => ({
            ...prev,
            summary: suggestion.summary,
            category: suggestion.category,
            stage: suggestion.stage,
            tags: [...new Set([...prev.tags, ...suggestion.tags])].slice(0, 10),
          }));
          setAiQuestions(suggestion.nextQuestions);
        },
      },
    );
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (form.title.trim().length === 0 || form.content.trim().length === 0) return;

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      category: form.category,
      stage: form.stage,
      tags: form.tags,
    };

    if (isEditing) {
      updateNote.mutate(
        {
          id: note.id,
          input: {
            ...payload,
            summary: form.summary.trim().length > 0 ? form.summary.trim() : null,
            sourceUrl: form.sourceUrl.trim().length > 0 ? form.sourceUrl.trim() : null,
            goalId: form.goalId.length > 0 ? form.goalId : null,
          },
        },
        { onSuccess: onClose },
      );
      return;
    }

    createNote.mutate(
      {
        ...payload,
        summary: form.summary.trim().length > 0 ? form.summary.trim() : undefined,
        sourceUrl: form.sourceUrl.trim().length > 0 ? form.sourceUrl.trim() : undefined,
        goalId: form.goalId.length > 0 ? form.goalId : undefined,
      },
      { onSuccess: onClose },
    );
  };

  const contentPlaceholder =
    form.type === "LINK"
      ? "https://..."
      : form.type === "SNIPPET"
        ? "Cole o trecho de código..."
        : form.type === "CHECKLIST"
          ? "Um item por linha..."
          : "Desenvolva a ideia aqui...";

  return (
    <AppModalShell
      title={isEditing ? "Editar nota" : "Nova nota"}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={form.title}
          onChange={(e) => patch("title", e.target.value)}
          placeholder="Título"
          className={INPUT_CLASS}
          required
          autoFocus
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">Formato</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {NOTE_TYPES.map((type) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              const isActive = form.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => patch("type", type)}
                  className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition ${
                    isActive
                      ? `border-zinc-600 ${meta.bgClass} ${meta.textClass}`
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {form.type === "LINK" ? (
          <input
            type="url"
            value={form.content}
            onChange={(e) => patch("content", e.target.value)}
            placeholder={contentPlaceholder}
            className={INPUT_CLASS}
            required
          />
        ) : (
          <textarea
            value={form.content}
            onChange={(e) => patch("content", e.target.value)}
            placeholder={contentPlaceholder}
            rows={form.type === "SNIPPET" ? 8 : 6}
            className={`${INPUT_CLASS} resize-none ${form.type === "SNIPPET" ? "font-mono text-xs" : ""}`}
            required
          />
        )}

        {aiUsage?.enabled === true && (
          <button
            type="button"
            onClick={handleSuggest}
            disabled={!canSuggest || suggestMetadata.isPending}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-violet-600/50 bg-violet-600/10 px-4 py-2.5 text-xs font-medium text-violet-300 transition hover:bg-violet-600/20 disabled:opacity-40"
          >
            {suggestMetadata.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {suggestMetadata.isPending
              ? "Analisando..."
              : "Organizar com IA (resumo, tags, categoria)"}
          </button>
        )}

        {aiQuestions.length > 0 && (
          <div className="rounded-lg border border-violet-900/50 bg-violet-950/20 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-violet-300">
              <Lightbulb className="h-3.5 w-3.5" />
              Para desenvolver a ideia
            </p>
            <ul className="space-y-1">
              {aiQuestions.map((question) => (
                <li key={question} className="text-[11px] leading-relaxed text-zinc-400">
                  · {question}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Resumo em uma linha (opcional)
          </label>
          <input
            type="text"
            value={form.summary}
            onChange={(e) => patch("summary", e.target.value)}
            placeholder="A essência da ideia, para achar rápido depois"
            className={INPUT_CLASS}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Categoria</label>
            <select
              className={INPUT_CLASS}
              value={form.category}
              onChange={(e) => patch("category", e.target.value as NoteCategory)}
            >
              {NOTE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_META[category].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Estágio</label>
            <select
              className={INPUT_CLASS}
              value={form.stage}
              onChange={(e) => patch("stage", e.target.value as NoteStage)}
            >
              {NOTE_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_META[stage].label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-zinc-600">
              {STAGE_META[form.stage].description}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">Tags</label>
          <TagInput
            tags={form.tags}
            onChange={(tags) => patch("tags", tags)}
            suggestions={tagSuggestions}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {form.type !== "LINK" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Fonte (opcional)
              </label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => patch("sourceUrl", e.target.value)}
                placeholder="De onde veio essa ideia?"
                className={INPUT_CLASS}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Vincular a uma meta (opcional)
            </label>
            <select
              className={INPUT_CLASS}
              value={form.goalId}
              onChange={(e) => patch("goalId", e.target.value)}
            >
              <option value="">Sem vínculo</option>
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
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
            disabled={
              isPending || form.title.trim().length === 0 || form.content.trim().length === 0
            }
            className="ls-btn-block flex-1"
          >
            {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar"}
          </button>
        </div>
      </form>
    </AppModalShell>
  );
}

/* ─── Card de Nota ─── */

function NoteCard({
  note,
  goalTitle,
  onEdit,
}: {
  readonly note: VaultNote;
  readonly goalTitle: string | null;
  readonly onEdit: (note: VaultNote) => void;
}): ReactElement {
  const deleteMutation = useDeleteNote();
  const updateMutation = useUpdateNote();

  const typeMeta = TYPE_META[note.type];
  const categoryMeta = CATEGORY_META[note.category];
  const stageMeta = STAGE_META[note.stage];
  const TypeIcon = typeMeta.icon;

  const handleDelete = (): void => {
    if (window.confirm("Excluir esta nota do cofre?")) {
      deleteMutation.mutate(note.id);
    }
  };

  const toggle = (input: { isFavorite?: boolean; isArchived?: boolean }): void => {
    updateMutation.mutate({ id: note.id, input });
  };

  return (
    <div
      className={`group flex flex-col rounded-xl border bg-zinc-950 p-3 transition md:p-4 ${
        note.isArchived
          ? "border-zinc-900 opacity-60 hover:opacity-100"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TypeIcon className={`h-4 w-4 shrink-0 ${typeMeta.textClass}`} />
          <h3 className="truncate text-sm font-medium text-zinc-100">{note.title}</h3>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => toggle({ isFavorite: !note.isFavorite })}
            className={`rounded-md p-1 transition ${
              note.isFavorite
                ? "text-amber-400"
                : "text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-amber-400"
            }`}
            aria-label={note.isFavorite ? "Remover dos favoritos" : "Marcar como favorita"}
          >
            <Star className="h-3.5 w-3.5" fill={note.isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="rounded-md p-1 text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-blue-400"
            aria-label="Editar nota"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggle({ isArchived: !note.isArchived })}
            className="rounded-md p-1 text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-zinc-300"
            aria-label={note.isArchived ? "Desarquivar nota" : "Arquivar nota"}
          >
            {note.isArchived ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-md p-1 text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400 disabled:opacity-50"
            aria-label="Excluir nota"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {note.summary !== null && (
        <p className="mb-2 text-xs font-medium text-zinc-400">{note.summary}</p>
      )}

      {note.type === "LINK" ? (
        <a
          href={note.content}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 truncate text-xs text-blue-400/80 underline decoration-blue-400/30 transition hover:text-blue-300"
        >
          {note.content}
        </a>
      ) : (
        <p
          className={`mb-2 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500 ${
            note.type === "SNIPPET" ? "font-mono" : ""
          }`}
        >
          {note.content}
        </p>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryMeta.bgClass} ${categoryMeta.textClass}`}
        >
          {categoryMeta.label}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageMeta.bgClass} ${stageMeta.textClass}`}
          title={stageMeta.description}
        >
          {stageMeta.label}
        </span>
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-400"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-zinc-800/50 pt-2">
        <span className="text-[10px] text-zinc-700">
          {new Date(note.createdAt).toLocaleDateString("pt-BR")}
        </span>
        {goalTitle !== null && (
          <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
            <Target className="h-2.5 w-2.5" />
            {goalTitle}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Barra de Filtros ─── */

function FilterChip({
  label,
  isActive,
  onClick,
  activeClass = "bg-zinc-700 text-zinc-100",
}: {
  readonly label: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly activeClass?: string;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        isActive
          ? activeClass
          : "border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Página Principal do Cofre ─── */

export function Vault(): ReactElement {
  const [editingNote, setEditingNote] = useState<VaultNote | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [filter, setFilter] = useState<VaultFilter>({});

  const {
    items: notes,
    total,
    isPending,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotes(filter, NOTES_PAGE_SIZE);

  const { items: goals } = useGoals({ pageSize: GOAL_SELECT_PAGE_SIZE });
  const { data: tagsData } = useVaultTags();

  const goalsMap = useMemo(
    () => new Map<string, string>(goals.map((g) => [g.id, g.title])),
    [goals],
  );

  const patchFilter = (changes: Partial<VaultFilter>): void => {
    setFilter((prev) => ({ ...prev, ...changes }));
  };

  const toggleTag = (tag: string): void => {
    const current = filter.tags ?? [];
    patchFilter({
      tags: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    });
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    patchFilter({ search: searchDraft.trim().length > 0 ? searchDraft.trim() : undefined });
  };

  const clearFilters = (): void => {
    setSearchDraft("");
    setFilter({});
  };

  const hasActiveFilters = Object.values(filter).some(
    (v) => v !== undefined && (!Array.isArray(v) || v.length > 0),
  );

  const closeForm = (): void => {
    setFormOpen(false);
    setEditingNote(null);
  };

  const openEdit = (note: VaultNote): void => {
    setEditingNote(note);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BookMarked className="h-6 w-6 shrink-0 text-zinc-400" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Cofre</h1>
            <p className="text-xs text-zinc-600">
              {total > 0 ? `${total} ideia${total !== 1 ? "s" : ""} guardada${total !== 1 ? "s" : ""}` : "Seu segundo cérebro"}
            </p>
          </div>
        </div>

        <button type="button" onClick={() => setFormOpen(true)} className="ls-btn">
          <Plus className="h-4 w-4" />
          Nova Nota
        </button>
      </div>

      {/* Busca */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Buscar por título, resumo ou conteúdo..."
          className={`${INPUT_CLASS} pl-9`}
        />
      </form>

      {/* Filtros */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="Todas"
            isActive={filter.category === undefined}
            onClick={() => patchFilter({ category: undefined })}
          />
          {NOTE_CATEGORIES.map((category) => {
            const meta = CATEGORY_META[category];
            return (
              <FilterChip
                key={category}
                label={meta.label}
                isActive={filter.category === category}
                onClick={() =>
                  patchFilter({ category: filter.category === category ? undefined : category })
                }
                activeClass={`${meta.bgClass} ${meta.textClass}`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {NOTE_STAGES.map((stage) => {
            const meta = STAGE_META[stage];
            return (
              <FilterChip
                key={stage}
                label={meta.label}
                isActive={filter.stage === stage}
                onClick={() => patchFilter({ stage: filter.stage === stage ? undefined : stage })}
                activeClass={`${meta.bgClass} ${meta.textClass}`}
              />
            );
          })}
          <FilterChip
            label="★ Favoritas"
            isActive={filter.onlyFavorites === true}
            onClick={() =>
              patchFilter({ onlyFavorites: filter.onlyFavorites === true ? undefined : true })
            }
            activeClass="bg-amber-500/15 text-amber-400"
          />
          <FilterChip
            label="Arquivadas"
            isActive={filter.includeArchived === true}
            onClick={() =>
              patchFilter({ includeArchived: filter.includeArchived === true ? undefined : true })
            }
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>

        {(tagsData?.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(tagsData?.tags ?? []).map(({ tag, count }) => {
              const isActive = (filter.tags ?? []).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-2 py-0.5 text-[11px] transition ${
                    isActive
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  #{tag} <span className="text-zinc-600">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isFormOpen && <NoteFormModal note={editingNote} onClose={closeForm} />}

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
          <p className="text-sm text-zinc-600">
            {hasActiveFilters ? "Nenhuma nota com esses filtros." : "Seu cofre está vazio."}
          </p>
          <p className="mt-1 text-xs text-zinc-700">
            {hasActiveFilters
              ? "Tente limpar os filtros."
              : "Adicione ideias, links e trechos, e conecte-os às suas metas."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                goalTitle={note.goalId !== null ? (goalsMap.get(note.goalId) ?? null) : null}
                onEdit={openEdit}
              />
            ))}
          </div>
          <LoadMoreButton
            hasMore={hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
            loadedCount={notes.length}
            total={total}
          />
        </div>
      )}
    </div>
  );
}
