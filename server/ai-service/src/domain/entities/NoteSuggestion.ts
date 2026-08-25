/** Espelha os enums do vault-service para que a sugestão seja aplicável direto na nota. */
export const NOTE_CATEGORIES = [
  "IDEA",
  "REFERENCE",
  "LEARNING",
  "PROJECT",
  "INSPIRATION",
  "OTHER",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export const NOTE_STAGES = ["SEED", "EXPLORING", "VALIDATED", "DONE", "DISCARDED"] as const;
export type NoteStage = (typeof NOTE_STAGES)[number];

export type NoteSuggestion = {
  /** Resumo de uma linha que vira o campo `summary` da nota. */
  readonly summary: string;
  readonly tags: readonly string[];
  readonly category: NoteCategory;
  readonly stage: NoteStage;
  /** Perguntas para o usuário desenvolver a ideia além do que ele escreveu. */
  readonly nextQuestions: readonly string[];
};
