import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAuthStore } from "@lib/auth";
import { trpc } from "@lib/trpc";

export const useLogout = () => {
  const { refreshToken, clearTokens } = useAuthStore();
  const logoutMutation = trpc.auth.logout.useMutation();
  const navigate = useNavigate();

  return useCallback(() => {
    const afterLogout = () => {
      clearTokens();
      navigate({ to: "/login" });
    };

    if (refreshToken) {
      logoutMutation.mutate({ refreshToken }, { onSettled: afterLogout });
    } else {
      afterLogout();
    }
  }, [refreshToken, clearTokens, logoutMutation, navigate]);
};
