import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/auth";

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled,
    retry: false,
  });
}
