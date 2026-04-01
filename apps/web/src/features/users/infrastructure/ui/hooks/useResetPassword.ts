import { useState } from "react";

import { trpc } from "@lib/trpc";

const AUTO_CLOSE_DELAY = 2000;

export const useResetPassword = (onClose: () => void) => {
  const [newPassword, setNewPassword] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const resetMutation = trpc.user.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setNewPassword("");
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, AUTO_CLOSE_DELAY);
    },
  });

  const handleSubmit = (userId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    resetMutation.mutate({ id: userId, newPassword });
  };

  return {
    newPassword,
    setNewPassword,
    success,
    isPending: resetMutation.isPending,
    error: resetMutation.error?.message ?? null,
    handleSubmit,
  };
};
