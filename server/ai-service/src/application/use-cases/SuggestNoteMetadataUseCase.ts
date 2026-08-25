import { z } from "zod";
import { err, ok, type Result } from "../result.js";
import type { LanguageModelUsage } from "../ports/ILanguageModel.js";
import type { AiRunError, AiRunner } from "../services/AiRunner.js";
import {
  NOTE_CATEGORIES,
  NOTE_STAGES,
  type NoteSuggestion,
} from "../../domain/entities/NoteSuggestion.js";

export type SuggestNoteMetadataDto = {
  readonly title: string;
  readonly content: string;
  /** Tags que o usuário já usa, para a IA reaproveitar em vez de inventar sinônimos. */
  readonly existingTags?: readonly string[];
};

export type SuggestNoteMetadataSuccess = {
  readonly suggestion: NoteSuggestion;
  readonly usage: LanguageModelUsage;
};

export type SuggestNoteMetadataError = AiRunError;

const MAX_SUGGESTED_TAGS = 5;
const MAX_QUESTIONS = 3;

const responseSchema = z.object({
  summary: z.string().min(1).max(200),
  tags: z.array(z.string().min(1).max(24)).max(MAX_SUGGESTED_TAGS),
  category: z.enum(NOTE_CATEGORIES),
  stage: z.enum(NOTE_STAGES),
  nextQuestions: z.array(z.string().min(1).max(200)).max(MAX_QUESTIONS),
});

const JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "tags", "category", "stage", "nextQuestions"],
  properties: {
    summary: { type: "string", description: "Resumo da nota em uma frase" },
    tags: {
      type: "array",
      description: `Até ${MAX_SUGGESTED_TAGS} tags em minúsculas, uma ou duas palavras cada`,
      items: { type: "string" },
    },
    category: { type: "string", enum: [...NOTE_CATEGORIES] },
    stage: { type: "string", enum: [...NOTE_STAGES] },
    nextQuestions: {
      type: "array",
      description: `Até ${MAX_QUESTIONS} perguntas que ajudam a desenvolver a ideia`,
      items: { type: "string" },
    },
  },
};

function buildSystemPrompt(existingTags: readonly string[]): string {
  const lines = [
    "Você organiza notas de um cofre de ideias pessoal, em português do Brasil.",
    "A partir do título e do conteúdo, devolva metadados úteis para achar e desenvolver a nota depois.",
    "Regras:",
    "- summary: uma frase objetiva, sem repetir literalmente o título.",
    "- tags: minúsculas, sem acento desnecessário, sem '#', focadas em tema e área.",
    "- category: IDEA para ideias novas, REFERENCE para material de consulta, LEARNING para estudo, PROJECT para algo em execução, INSPIRATION para referências criativas, OTHER se nenhuma servir.",
    "- stage: SEED quando a nota é só um esboço, EXPLORING quando já há pesquisa, VALIDATED quando a decisão está tomada, DONE quando já foi executada, DISCARDED quando foi abandonada.",
    "- nextQuestions: perguntas curtas e específicas que fariam o usuário avançar; não repita o que já está escrito.",
  ];

  if (existingTags.length > 0) {
    lines.push(
      `- Reaproveite estas tags já usadas quando fizerem sentido: ${existingTags.join(", ")}.`,
    );
  }

  return lines.join("\n");
}

export class SuggestNoteMetadataUseCase {
  constructor(private readonly runner: AiRunner) {}

  async execute(
    userId: string,
    dto: SuggestNoteMetadataDto,
  ): Promise<Result<SuggestNoteMetadataSuccess, SuggestNoteMetadataError>> {
    const result = await this.runner.run({
      userId,
      feature: "VAULT_SUGGEST",
      prompt: {
        system: buildSystemPrompt(dto.existingTags ?? []),
        user: `Título: ${dto.title}\n\nConteúdo:\n${dto.content}`,
        schemaName: "note_metadata",
        jsonSchema: JSON_SCHEMA,
        maxOutputTokens: 1_500,
      },
      parse: (content) => {
        const parsed = responseSchema.safeParse(content);
        if (!parsed.success) return null;
        return {
          ...parsed.data,
          tags: parsed.data.tags.map((tag) => tag.trim().toLowerCase()),
        };
      },
    });

    if (!result.ok) return err(result.error);
    return ok({ suggestion: result.value.value, usage: result.value.usage });
  }
}
