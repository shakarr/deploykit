import { useState } from "react";
import { Server, Plus, Monitor, Layers } from "lucide-react";

import { Card, Button, EmptyState, ConfirmDialog } from "@shared/components";
import {
  ServerCard,
  ImageCleanupPanel,
  AddServerModal,
} from "@server/infrastructure/ui/components";

import { useAuthStore } from "@lib/auth";
import { trpc } from "@lib/trpc";

export const ServersPage: React.FC = () => {
  const utils = trpc.useUtils();
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const { data: servers, isLoading } = trpc.server.list.useQuery();

  const [showAddServer, setShowAddServer] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const createLocalMutation = trpc.server.createLocal.useMutation({
    onSuccess: () => utils.server.list.invalidate(),
  });

  const deleteMutation = trpc.server.delete.useMutation({
    onSuccess: () => {
      utils.server.list.invalidate();
      setDeleteTarget(null);
    },
  });

  const hasLocal = servers?.some((s) => s.isLocal);
  const [showCleanup, setShowCleanup] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Servers</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage servers where your applications are deployed
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {!hasLocal && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => createLocalMutation.mutate()}
                disabled={createLocalMutation.isPending}
              >
                <Monitor className="w-3.5 h-3.5" />
                {createLocalMutation.isPending
                  ? "Adding..."
                  : "Add Local Server"}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCleanup(true)}
            >
              <Layers className="w-3.5 h-3.5" />
              Clean images
            </Button>
            <Button size="sm" onClick={() => setShowAddServer(true)}>
              <Plus className="w-3.5 h-3.5" />
              Add Server
            </Button>
          </div>
        )}
      </div>

      {/* Server List */}
      {isLoading ? (
        <div className="text-sm text-text-muted p-6">Loading...</div>
      ) : !servers?.length ? (
        <Card>
          <EmptyState
            icon={<Server className="w-5 h-5" />}
            title="No servers configured"
            description="Add your local Docker engine or a remote server to start deploying applications."
            action={
              isAdmin ? (
                <Button
                  size="sm"
                  onClick={() => createLocalMutation.mutate()}
                  disabled={createLocalMutation.isPending}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Add Local Server
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              isAdmin={isAdmin}
              onDelete={() =>
                setDeleteTarget({ id: server.id, name: server.name })
              }
            />
          ))}
        </div>
      )}

      {/* Add Server Modal */}
      <AddServerModal
        open={showAddServer}
        onClose={() => setShowAddServer(false)}
        onCreated={() => {
          setShowAddServer(false);
          utils.server.list.invalidate();
        }}
      />

      {/* Image Cleanup Panel */}
      {isAdmin && (
        <ImageCleanupPanel
          servers={servers ?? []}
          open={showCleanup}
          onClose={() => setShowCleanup(false)}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })
        }
        title="Delete Server"
        description={`Remove "${deleteTarget?.name}" from DeployKit? This won't affect running containers on the server.`}
        confirmText="Remove Server"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};
