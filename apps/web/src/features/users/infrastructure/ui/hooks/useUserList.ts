import { useState } from "react";

import { trpc } from "@lib/trpc";
import { useAuthStore } from "@lib/auth";

export const useUserList = () => {
  const utils = trpc.useUtils();
  const currentUser = useAuthStore((s) => s.user);
  const { data: users, isLoading } = trpc.user.list.useQuery();

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const [resetTarget, setResetTarget] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      setDeleteTarget(null);
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate({ id: deleteTarget.id });
    }
  };

  const invalidateList = () => utils.user.list.invalidate();

  return {
    users,
    isLoading,
    currentUserId: currentUser?.id,

    showCreateModal,
    openCreateModal: () => setShowCreateModal(true),
    closeCreateModal: () => setShowCreateModal(false),

    deleteTarget,
    setDeleteTarget,
    handleDeleteConfirm,
    isDeleting: deleteMutation.isPending,

    resetTarget,
    setResetTarget,

    invalidateList,
  };
};
