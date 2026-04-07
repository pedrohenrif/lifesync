import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotes,
  createNote,
  deleteNote,
  VaultApiError,
  type CreateNoteInput,
} from "../api/vault";

const VAULT_KEY = ["vault"] as const;

export function useNotes() {
  return useQuery({
    queryKey: VAULT_KEY,
    queryFn: getNotes,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VAULT_KEY });
      toast.success("Nota salva no cofre!");
    },
    onError: (error) => {
      toast.error(
        error instanceof VaultApiError
          ? error.message
          : "Não foi possível salvar a nota.",
      );
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VAULT_KEY });
      toast.success("Nota removida.");
    },
    onError: (error) => {
      toast.error(
        error instanceof VaultApiError
          ? error.message
          : "Não foi possível remover a nota.",
      );
    },
  });
}
