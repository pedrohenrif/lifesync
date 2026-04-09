import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import {
  Target,
  Plus,
  Trash2,
  Circle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  AlertTriangle,
  CheckSquare,
  Square,
  Sword,
} from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import type { Goal, GoalTask, GoalStatus, GoalCategory } from "../api/goals";
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useAddGoalTask,
  useToggleGoalTask,
  useRemoveGoalTask,
} from "../hooks/useGoals";
import { AppModalShell } from "../components/ui/AppModalShell";

/* ─── Mapeamentos de Categoria ─── */

type CategoryConfig = {
  readonly label: string;
  readonly bgClass: string;
  readonly textClass: string;
};

const CATEGORY_MAP: Record<GoalCategory, CategoryConfig> = {
  STUDY: { label: "Estudos", bgClass: "bg-blue-500/15", textClass: "text-blue-400" },
  PERSONAL: { label: "Pessoal", bgClass: "bg-violet-500/15", textClass: "text-violet-400" },
  BUSINESS: { label: "Empresarial", bgClass: "bg-emerald-500/15", textClass: "text-emerald-400" },
  FAMILY: { label: "Familiar", bgClass: "bg-amber-500/15", textClass: "text-amber-400" },
  DREAMS: { label: "Sonhos", bgClass: "bg-pink-500/15", textClass: "text-pink-400" },
  OTHER: { label: "Outro", bgClass: "bg-zinc-500/15", textClass: "text-zinc-400" },
};

const FILTER_OPTIONS: readonly { readonly value: GoalCategory | undefined; readonly label: string }[] = [
  { value: undefined, label: "Todas" },
  { value: "STUDY", label: "Estudos" },
  { value: "PERSONAL", label: "Pessoal" },
  { value: "BUSINESS", label: "Empresarial" },
  { value: "FAMILY", label: "Familiar" },
  { value: "DREAMS", label: "Sonhos" },
  { value: "OTHER", label: "Outro" },
];

const CATEGORY_SELECT_OPTIONS: readonly { readonly value: GoalCategory; readonly label: string }[] = [
  { value: "STUDY", label: "Estudos" },
  { value: "PERSONAL", label: "Pessoal" },
  { value: "BUSINESS", label: "Empresarial" },
  { value: "FAMILY", label: "Familiar" },
  { value: "DREAMS", label: "Sonhos" },
  { value: "OTHER", label: "Outro" },
];

/* ─── Colunas Kanban ─── */

type ColumnConfig = {
  readonly status: GoalStatus;
  readonly label: string;
  readonly icon: typeof Circle;
  readonly accent: string;
  readonly iconColor: string;
  readonly emptyText: string;
  readonly prev: GoalStatus | null;
  readonly next: GoalStatus | null;
};

const COLUMNS: readonly ColumnConfig[] = [
  {
    status: "PENDING",
    label: "Pendentes",
    icon: Circle,
    accent: "border-zinc-700",
    iconColor: "text-zinc-400",
    emptyText: "Nenhuma meta pendente",
    prev: null,
    next: "IN_PROGRESS",
  },
  {
    status: "IN_PROGRESS",
    label: "Em Andamento",
    icon: Clock,
    accent: "border-amber-800",
    iconColor: "text-amber-400",
    emptyText: "Nenhuma meta em andamento",
    prev: "PENDING",
    next: "COMPLETED",
  },
  {
    status: "COMPLETED",
    label: "Concluídas",
    icon: CheckCircle2,
    accent: "border-emerald-800",
    iconColor: "text-emerald-400",
    emptyText: "Nenhuma meta concluída",
    prev: "IN_PROGRESS",
    next: null,
  },
];

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-100 focus:bg-zinc-900";

/* ─── Lógica de Prazo ─── */

function DeadlineIndicator({ targetDate }: { readonly targetDate: string }): ReactElement {
  const diff = differenceInCalendarDays(new Date(targetDate), new Date());

  if (diff < 0) {
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-red-400">
        <AlertTriangle className="h-3 w-3" />
        Atrasada
      </div>
    );
  }

  if (diff <= 3) {
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-amber-400">
        <Clock className="h-3 w-3" />
        Vence em {diff === 0 ? "hoje" : `${diff}d`}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-zinc-500">
      <CalendarDays className="h-3 w-3" />
      {new Date(targetDate).toLocaleDateString("pt-BR")}
    </div>
  );
}

/* ─── Badge de Categoria ─── */

function CategoryBadge({ category }: { readonly category: GoalCategory }): ReactElement {
  const config = CATEGORY_MAP[category];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bgClass} ${config.textClass}`}>
      {config.label}
    </span>
  );
}

/* ─── Barra de Progresso ─── */

/** Barra estilo “HP do desafio”: encolhe (vermelho/laranja) conforme subtarefas são concluídas. */
function BossTaskProgressBar({ tasks }: { readonly tasks: readonly GoalTask[] }): ReactElement {
  const total = tasks.length;
  const incomplete = tasks.filter((t) => !t.isCompleted).length;
  const hpPct = total > 0 ? Math.round((incomplete / total) * 100) : 0;
  const done = total - incomplete;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-orange-400/90">Resistência do desafio</span>
        <span className="text-[10px] font-medium text-zinc-500">
          {done}/{total} etapas
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-950 ring-1 ring-orange-950/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 transition-all duration-500"
          style={{ width: `${hpPct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Checklist de Sub-tarefas ─── */

function TaskChecklist({
  goalId,
  tasks,
}: {
  readonly goalId: string;
  readonly tasks: readonly GoalTask[];
}): ReactElement {
  const toggleTask = useToggleGoalTask();
  const removeTask = useRemoveGoalTask();

  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="group flex items-center gap-2 rounded-md px-1 py-1 transition hover:bg-zinc-800/50"
        >
          <button
            type="button"
            onClick={() => toggleTask.mutate({ goalId, taskId: task.id })}
            className="shrink-0 text-zinc-500 transition hover:text-emerald-400"
            aria-label={task.isCompleted ? "Desmarcar" : "Marcar"}
          >
            {task.isCompleted ? (
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
          </button>

          <span
            className={`flex-1 text-xs ${
              task.isCompleted ? "text-zinc-500 line-through" : "text-zinc-300"
            }`}
          >
            {task.title}
          </span>

          <button
            type="button"
            onClick={() => removeTask.mutate({ goalId, taskId: task.id })}
            className="shrink-0 rounded p-0.5 text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
            aria-label="Remover sub-tarefa"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ─── Input Inline de Criação de Sub-tarefa ─── */

function InlineAddTask({ goalId }: { readonly goalId: string }): ReactElement {
  const [value, setValue] = useState("");
  const addTask = useAddGoalTask();

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    addTask.mutate(
      { goalId, title: trimmed },
      { onSuccess: () => setValue("") },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5 mt-1">
      <Plus className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Adicionar sub-tarefa..."
        className="flex-1 bg-transparent text-xs text-zinc-300 outline-none placeholder:text-zinc-700"
      />
      {value.trim().length > 0 && (
        <button
          type="submit"
          disabled={addTask.isPending}
          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
        >
          OK
        </button>
      )}
    </form>
  );
}

/* ─── Card de Meta ─── */

function GoalCard({
  goal,
  column,
}: {
  readonly goal: Goal;
  readonly column: ColumnConfig;
}): ReactElement {
  const updateGoal = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const isUpdating = updateGoal.isPending;
  const isDeleting = deleteGoalMutation.isPending;

  const moveTo = (status: GoalStatus): void => {
    updateGoal.mutate({ id: goal.id, input: { status } });
  };

  const hasTasks = goal.tasks.length > 0;

  return (
    <div className="space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-zinc-700 md:p-4">
      {/* Cabeçalho: categoria + prazo */}
      <div className="flex items-center justify-between">
        <CategoryBadge category={goal.category} />
        {goal.targetDate !== null && goal.status !== "COMPLETED" && (
          <DeadlineIndicator targetDate={goal.targetDate} />
        )}
        {goal.targetDate !== null && goal.status === "COMPLETED" && (
          <div className="flex items-center gap-1 text-xs text-zinc-600">
            <CalendarDays className="h-3 w-3" />
            {new Date(goal.targetDate).toLocaleDateString("pt-BR")}
          </div>
        )}
      </div>

      {/* Título */}
      <div className="flex items-start gap-2">
        {hasTasks ? (
          <Sword
            className="mt-0.5 h-4 w-4 shrink-0 text-orange-500/85"
            aria-hidden
          />
        ) : null}
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">{goal.title}</h3>
      </div>

      {/* Descrição */}
      {goal.description !== null && goal.description.length > 0 && (
        <p className="text-xs leading-relaxed text-zinc-500">{goal.description}</p>
      )}

      {/* Barra de Progresso (se houver tasks) */}
      {hasTasks && <BossTaskProgressBar tasks={goal.tasks} />}

      {/* Checklist de sub-tarefas */}
      {hasTasks && (
        <div className="max-h-40 overflow-y-auto">
          <TaskChecklist goalId={goal.id} tasks={goal.tasks} />
        </div>
      )}

      {/* Input inline para adicionar sub-tarefa */}
      <InlineAddTask goalId={goal.id} />

      {/* Ações: mover entre colunas + excluir */}
      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-1">
          {column.prev !== null && (
            <button
              type="button"
              onClick={() => moveTo(column.prev as GoalStatus)}
              disabled={isUpdating}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
              aria-label="Mover para anterior"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          {column.next !== null && (
            <button
              type="button"
              onClick={() => moveTo(column.next as GoalStatus)}
              disabled={isUpdating}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
              aria-label="Mover para próximo"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => deleteGoalMutation.mutate(goal.id)}
          disabled={isDeleting}
          className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-zinc-600 transition hover:bg-red-950/60 hover:text-red-400 disabled:opacity-50"
          aria-label="Excluir meta"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Coluna Kanban ─── */

function KanbanColumn({
  column,
  goals,
}: {
  readonly column: ColumnConfig;
  readonly goals: Goal[];
}): ReactElement {
  const Icon = column.icon;

  return (
    <div className="flex flex-col">
      <div className={`mb-4 flex items-center gap-2.5 border-b-2 pb-3 ${column.accent}`}>
        <Icon className={`h-4 w-4 ${column.iconColor}`} />
        <h2 className="text-sm font-semibold text-zinc-200">{column.label}</h2>
        <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
          {goals.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5">
        {goals.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-600">{column.emptyText}</p>
        ) : (
          goals.map((goal) => <GoalCard key={goal.id} goal={goal} column={column} />)
        )}
      </div>
    </div>
  );
}

/* ─── Formulário de Criação ─── */

function CreateGoalForm({ onClose }: { readonly onClose: () => void }): ReactElement {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("PERSONAL");
  const [targetDate, setTargetDate] = useState("");
  const createGoal = useCreateGoal();

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) return;

    createGoal.mutate(
      {
        title: trimmedTitle,
        description: description.trim().length > 0 ? description.trim() : undefined,
        category,
        targetDate: targetDate.length > 0 ? targetDate : undefined,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setTargetDate("");
          onClose();
        },
      },
    );
  };

  return (
    <AppModalShell title="Nova meta" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da meta"
          className={INPUT_CLASS}
          required
          autoFocus
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          className={INPUT_CLASS}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Categoria</label>
            <select
              className={INPUT_CLASS}
              value={category}
              onChange={(e) => setCategory(e.target.value as GoalCategory)}
              required
            >
              {CATEGORY_SELECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Prazo Final</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createGoal.isPending || title.trim().length === 0}
          className="min-h-11 w-full rounded-lg bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {createGoal.isPending ? "Criando..." : "Adicionar Meta"}
        </button>
      </form>
    </AppModalShell>
  );
}

/* ─── Barra de Filtros ─── */

function CategoryFilterBar({
  selected,
  onChange,
}: {
  readonly selected: GoalCategory | undefined;
  readonly onChange: (v: GoalCategory | undefined) => void;
}): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((opt) => {
        const isActive = selected === opt.value;
        const categoryConfig = opt.value !== undefined ? CATEGORY_MAP[opt.value] : undefined;

        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              isActive
                ? categoryConfig !== undefined
                  ? `${categoryConfig.bgClass} ${categoryConfig.textClass}`
                  : "bg-zinc-700 text-zinc-100"
                : "border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Página Principal ─── */

export function Goals(): ReactElement {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | undefined>(undefined);
  const { data, isPending, isError } = useGoals(selectedCategory);
  const goals = data?.goals ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 shrink-0 text-zinc-400" />
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Metas</h1>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nova Meta
          </button>
        )}
      </div>

      <CategoryFilterBar selected={selectedCategory} onChange={setSelectedCategory} />

      {showForm && <CreateGoalForm onClose={() => setShowForm(false)} />}

      {isPending ? (
        <div className="flex justify-center py-16">
          <div className="flex items-center gap-3 text-zinc-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
            <span className="text-sm">Carregando metas...</span>
          </div>
        </div>
      ) : isError ? (
        <p className="py-16 text-center text-sm text-red-400/90">
          Erro ao carregar metas. Tente recarregar a página.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.status}
              column={column}
              goals={goals.filter((g) => g.status === column.status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
