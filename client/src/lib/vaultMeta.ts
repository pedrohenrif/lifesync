import {
  FileText,
  ExternalLink,
  Code2,
  ListChecks,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Rocket,
  Sparkles,
  Archive,
  type LucideIcon,
} from "lucide-react";
import type { NoteCategory, NoteStage, NoteType } from "../api/vault";

type MetaConfig = {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly textClass: string;
  readonly bgClass: string;
};

export const TYPE_META: Record<NoteType, MetaConfig> = {
  NOTE: {
    label: "Anotação",
    icon: FileText,
    textClass: "text-violet-400",
    bgClass: "bg-violet-500/15",
  },
  LINK: {
    label: "Link",
    icon: ExternalLink,
    textClass: "text-blue-400",
    bgClass: "bg-blue-500/15",
  },
  SNIPPET: {
    label: "Trecho de código",
    icon: Code2,
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/15",
  },
  CHECKLIST: {
    label: "Checklist",
    icon: ListChecks,
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/15",
  },
};

export const CATEGORY_META: Record<NoteCategory, MetaConfig> = {
  IDEA: {
    label: "Ideia",
    icon: Lightbulb,
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/15",
  },
  REFERENCE: {
    label: "Referência",
    icon: BookOpen,
    textClass: "text-blue-400",
    bgClass: "bg-blue-500/15",
  },
  LEARNING: {
    label: "Aprendizado",
    icon: GraduationCap,
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/15",
  },
  PROJECT: {
    label: "Projeto",
    icon: Rocket,
    textClass: "text-violet-400",
    bgClass: "bg-violet-500/15",
  },
  INSPIRATION: {
    label: "Inspiração",
    icon: Sparkles,
    textClass: "text-pink-400",
    bgClass: "bg-pink-500/15",
  },
  OTHER: {
    label: "Outro",
    icon: Archive,
    textClass: "text-zinc-400",
    bgClass: "bg-zinc-500/15",
  },
};

type StageConfig = {
  readonly label: string;
  readonly description: string;
  readonly textClass: string;
  readonly bgClass: string;
};

/** A ordem reflete a evolução natural de uma ideia dentro do cofre. */
export const STAGE_META: Record<NoteStage, StageConfig> = {
  SEED: {
    label: "Semente",
    description: "Ideia crua, ainda sem desenvolvimento",
    textClass: "text-zinc-400",
    bgClass: "bg-zinc-500/15",
  },
  EXPLORING: {
    label: "Explorando",
    description: "Em pesquisa e amadurecimento",
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/15",
  },
  VALIDATED: {
    label: "Validada",
    description: "Confirmada, pronta para executar",
    textClass: "text-blue-400",
    bgClass: "bg-blue-500/15",
  },
  DONE: {
    label: "Concluída",
    description: "Já foi executada",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/15",
  },
  DISCARDED: {
    label: "Descartada",
    description: "Não faz mais sentido seguir",
    textClass: "text-red-400",
    bgClass: "bg-red-500/15",
  },
};
