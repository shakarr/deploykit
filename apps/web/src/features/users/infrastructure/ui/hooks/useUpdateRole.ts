import { trpc } from "@lib/trpc";

export const useUpdateRole = () => {
  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => utils.user.list.invalidate(),
  });

  const updateRole = (id: string, role: string) => {
    updateRoleMutation.mutate({ id, role: role as any });
  };

  return {
    updateRole,
    isPending: updateRoleMutation.isPending,
  };
};
