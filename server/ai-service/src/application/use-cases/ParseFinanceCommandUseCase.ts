import { z } from "zod";
import { err, ok, type Result } from "../result.js";
import type { LanguageModelUsage } from "../ports/ILanguageModel.js";
import type { AiRunError, AiRunner } from "../services/AiRunner.js";
import {
  PAYMENT_METHODS,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
  type TransactionDraft,
} from "../../domain/entities/TransactionDraft.js";

export type ParseFinanceCommandSuccess = {
  readonly drafts: readonly TransactionDraft[];
  readonly usage: LanguageModelUsage;
};

export type ParseFinanceCommandError =
  | AiRunError
  | { readonly code: "NO_TRANSACTION_FOUND" };

const draftSchema = z.object({
  title: z.string().min(1).max(120),
  amount: z.number().positive(),
  type: z.enum(TRANSACTION_TYPES),
  category: z.enum(TRANSACTION_CATEGORIES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.enum(PAYMENT_METHODS),
  isFixed: z.boolean(),
  installments: z.number().int().min(1).max(48).nullable(),
  confidence: z.number().min(0).max(1),
});

const responseSchema = z.object({
  transactions: z.array(draftSchema).max(10),
});

const JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["transactions"],
  properties: {
    transactions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "amount",
          "type",
          "category",
          "date",
          "paymentMethod",
          "isFixed",
          "installments",
          "confidence",
        ],
        properties: {
          title: { type: "string", description: "Descrição curta do lançamento" },
          amount: { type: "number", description: "Valor positivo em reais" },
          type: { type: "string", enum: [...TRANSACTION_TYPES] },
          category: { type: "string", enum: [...TRANSACTION_CATEGORIES] },
          date: { type: "string", description: "Data no formato YYYY-MM-DD" },
          paymentMethod: { type: "string", enum: [...PAYMENT_METHODS] },
          isFixed: { type: "boolean", description: "Verdadeiro para despesas recorrentes mensais" },
          installments: {
            type: ["integer", "null"],
            description: "Número de parcelas, ou null quando à vista",
          },
          confidence: { type: "number", description: "Confiança na interpretação, de 0 a 1" },
        },
      },
    },
  },
};

function buildSystemPrompt(today: string): string {
  return [
    "Você extrai lançamentos financeiros de frases em português do Brasil.",
    `A data de hoje é ${today}. Resolva expressões relativas como "ontem", "sexta passada" ou "dia 5" a partir dela.`,
    "Regras:",
    "- Valores sempre positivos; o sinal é definido pelo campo type.",
    "- Receitas (salário, pagamento recebido, venda) são INCOME; o resto é EXPENSE.",
    "- Escolha a categoria mais próxima da lista permitida; use 'Outros' quando nenhuma servir.",
    "- paymentMethod é CREDIT apenas se a frase citar cartão de crédito ou parcelamento; caso contrário DEBIT.",
    "- isFixed apenas para contas recorrentes mensais (aluguel, assinatura, mensalidade).",
    "- installments só quando a frase indicar parcelas; nesse caso amount é o valor total.",
    "- Se a frase tiver vários lançamentos, devolva um item por lançamento.",
    "- Se nada financeiro for identificável, devolva a lista vazia.",
    "- confidence baixo (menor que 0.5) quando você tiver que adivinhar valor, data ou categoria.",
  ].join("\n");
}

export class ParseFinanceCommandUseCase {
  constructor(private readonly runner: AiRunner) {}

  async execute(
    userId: string,
    text: string,
    today: Date,
  ): Promise<Result<ParseFinanceCommandSuccess, ParseFinanceCommandError>> {
    const result = await this.runner.run({
      userId,
      feature: "FINANCE_PARSE",
      prompt: {
        system: buildSystemPrompt(today.toISOString().slice(0, 10)),
        user: text,
        schemaName: "transaction_extraction",
        jsonSchema: JSON_SCHEMA,
        maxOutputTokens: 2_000,
      },
      parse: (content) => {
        const parsed = responseSchema.safeParse(content);
        return parsed.success ? parsed.data.transactions : null;
      },
    });

    if (!result.ok) return err(result.error);
    if (result.value.value.length === 0) {
      return err({ code: "NO_TRANSACTION_FOUND" });
    }

    return ok({ drafts: result.value.value, usage: result.value.usage });
  }
}
