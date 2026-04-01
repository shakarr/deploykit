import { useState } from "react";

import { trpc } from "@lib/trpc";

export const useProfileForm = () => {
  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState<string>("");
  const [initialized, setInitialized] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (user && !initialized) {
    setEmail(user.email);
    setInitialized(true);
  }

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ email });
  };

  const hasChanges = email !== user?.email;

  return {
    user,
    email,
    setEmail,
    success,
    isPending: updateMutation.isPending,
    error: updateMutation.error?.message ?? null,
    hasChanges,
    handleSubmit,
  };
};
