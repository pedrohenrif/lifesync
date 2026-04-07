import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  saveJournalEntry,
  getTodayEntry,
  JournalApiError,
  type SaveJournalInput,
} from "../api/journal";

const JOURNAL_KEY = ["journal"] as const;

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useTodayJournal() {
  const date = todayKey();
  return useQuery({
    queryKey: [...JOURNAL_KEY, "today", date],
    queryFn: () => getTodayEntry(date),
  });
}

export function useSaveJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveJournalInput) => saveJournalEntry(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOURNAL_KEY });
      toast.success("Registro do dia salvo!");
    },
    onError: (error) => {
      const message =
        error instanceof JournalApiError
          ? error.message
          : "Não foi possível salvar o registro.";
      toast.error(message);
    },
  });
}
