import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
  addGoalTask,
  toggleGoalTask,
  removeGoalTask,
  GoalsApiError,
  type CreateGoalInput,
  type UpdateGoalInput,
  type GoalCategory,
} from "../api/goals";

const GOALS_KEY = ["goals"] as const;
const ME_KEY = ["auth", "me"] as const;

export function useGoals(category?: GoalCategory) {
  return useQuery({
    queryKey: category !== undefined ? [...GOALS_KEY, category] : GOALS_KEY,
    queryFn: () => getGoals(category),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInput) => createGoal(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      toast.success("Meta criada com sucesso!");
    },
    onError: (error) => {
      toast.error(error instanceof GoalsApiError ? error.message : "Não foi possível criar a meta.");
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGoalInput }) => updateGoal(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
      toast.success("Meta atualizada!");
    },
    onError: (error) => {
      toast.error(error instanceof GoalsApiError ? error.message : "Não foi possível atualizar a meta.");
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      toast.success("Meta excluída.");
    },
    onError: (error) => {
      toast.error(error instanceof GoalsApiError ? error.message : "Não foi possível excluir a meta.");
    },
  });
}

export function useAddGoalTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, title }: { goalId: string; title: string }) =>
      addGoalTask(goalId, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof GoalsApiError ? error.message : "Não foi possível criar a sub-tarefa.");
    },
  });
}

export function useToggleGoalTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, taskId }: { goalId: string; taskId: string }) =>
      toggleGoalTask(goalId, taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof GoalsApiError ? error.message : "Não foi possível atualizar a sub-tarefa.");
    },
  });
}

export function useRemoveGoalTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, taskId }: { goalId: string; taskId: string }) =>
      removeGoalTask(goalId, taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof GoalsApiError ? error.message : "Não foi possível remover a sub-tarefa.");
    },
  });
}
