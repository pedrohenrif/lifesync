import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  parseFinanceCommand,
  suggestNoteMetadata,
  getAiUsage,
  AiApiError,
} from "../api/ai";

const AI_USAGE_KEY = ["ai", "usage"] as const;

function notifyError(error: unknown): void {
  toast.error(
    error instanceof AiApiError ? error.message : "Não foi possível falar com a IA.",
  );
}

/** Consumo do mês e disponibilidade da IA; usado para esconder a UI quando não há chave. */
export function useAiUsage() {
  return useQuery({
    queryKey: AI_USAGE_KEY,
    queryFn: getAiUsage,
    staleTime: 60_000,
    retry: false,
  });
}

export function useParseFinanceCommand() {
  return useMutation({
    mutationFn: (text: string) => parseFinanceCommand(text),
    onError: notifyError,
  });
}

export function useSuggestNoteMetadata() {
  return useMutation({
    mutationFn: (input: {
      readonly title: string;
      readonly content: string;
      readonly existingTags?: readonly string[];
    }) => suggestNoteMetadata(input),
    onError: notifyError,
  });
}
