import { useCallback } from "react";

import { trpc } from "@lib/trpc";

interface DatabaseActionsPropsI {
  start: MutationActionsI;
  stop: MutationActionsI;
  remove: MutationActionsI;
}

interface MutationActionsI {
  mutate: (args: { id: string }) => void;
  isPending: boolean;
}

export const useDatabaseActions = (
  databaseId: string,
  onDeleted: () => void,
): DatabaseActionsPropsI => {
  const utils = trpc.useUtils();

  const invalidate = useCallback(
    () => utils.database.byId.invalidate({ id: databaseId }),
    [utils, databaseId],
  );

  const startMutation = trpc.database.start.useMutation({
    onSuccess: invalidate,
  });
  const stopMutation = trpc.database.stop.useMutation({
    onSuccess: invalidate,
  });
  const removeMutation = trpc.database.delete.useMutation({
    onSuccess: onDeleted,
  });

  return {
    start: { mutate: startMutation.mutate, isPending: startMutation.isPending },
    stop: { mutate: stopMutation.mutate, isPending: stopMutation.isPending },
    remove: {
      mutate: removeMutation.mutate,
      isPending: removeMutation.isPending,
    },
  };
};
