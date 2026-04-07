import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { createElement } from "react";
import {
  createHabit,
  getHabits,
  toggleHabit,
  updateHabit,
  deleteHabit,
  HabitsApiError,
  type CreateHabitInput,
  type UpdateHabitInput,
  type HabitToggleResponse,
} from "../api/habits";

const HABITS_KEY = ["habits"] as const;

export function useHabits() {
  return useQuery({
    queryKey: HABITS_KEY,
    queryFn: getHabits,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HABITS_KEY });
      toast.success("Hábito criado com sucesso!");
    },
    onError: (error) => {
      const message =
        error instanceof HabitsApiError
          ? error.message
          : "Não foi possível criar o hábito.";
      toast.error(message);
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHabitInput }) =>
      updateHabit(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HABITS_KEY });
      toast.success("Hábito atualizado!");
    },
    onError: (error) => {
      const message =
        error instanceof HabitsApiError
          ? error.message
          : "Não foi possível atualizar o hábito.";
      toast.error(message);
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HABITS_KEY });
      toast.success("Hábito excluído.");
    },
    onError: (error) => {
      const message =
        error instanceof HabitsApiError
          ? error.message
          : "Não foi possível excluir o hábito.";
      toast.error(message);
    },
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      toggleHabit(id, date),
    onSuccess: (data: HabitToggleResponse) => {
      void queryClient.invalidateQueries({ queryKey: HABITS_KEY });

      if (data.habit.levelUp) {
        toast.success(`Você subiu para o Nível ${data.habit.level} neste hábito!`, {
          icon: createElement(Trophy, { className: "h-5 w-5 text-amber-400" }),
          duration: 5000,
        });
      }
    },
    onError: (error) => {
      const message =
        error instanceof HabitsApiError
          ? error.message
          : "Não foi possível atualizar o hábito.";
      toast.error(message);
    },
  });
}
