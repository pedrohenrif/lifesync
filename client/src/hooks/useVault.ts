import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotes,
  getVaultTags,
  createNote,
  updateNote,
  deleteNote,
  VaultApiError,
  type CreateNoteInput,
  type UpdateNoteInput,
  type NotesPage,
  type VaultFilter,
  type VaultNote,
} from "../api/vault";
import { useInfiniteList } from "./useInfiniteList";

const VAULT_KEY = ["vault"] as const;
const VAULT_TAGS_KEY = ["vault", "tags"] as const;

function invalidateVault(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: VAULT_KEY });
}

export function useNotes(filter: VaultFilter = {}, pageSize?: number) {
  return useInfiniteList<VaultNote, NotesPage>({
    queryKey: [...VAULT_KEY, "list", filter],
    fetchPage: (request) => getNotes(request, filter),
    pageSize,
  });
}

export function useVaultTags() {
  return useQuery({
    queryKey: VAULT_TAGS_KEY,
    queryFn: getVaultTags,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    onSuccess: () => {
      invalidateVault(queryClient);
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

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) =>
      updateNote(id, input),
    onSuccess: () => {
      invalidateVault(queryClient);
    },
    onError: (error) => {
      toast.error(
        error instanceof VaultApiError
          ? error.message
          : "Não foi possível atualizar a nota.",
      );
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      invalidateVault(queryClient);
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
