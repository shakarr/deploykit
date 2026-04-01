import { memo, useState } from "react";
import type { DatabaseType } from "@deploykit/shared";

import { Modal, Button, Input, Select } from "@shared/components";
import { ServerSelector } from "@project/infrastructure/ui/components/ServerSelector";

import { trpc } from "@lib/trpc";
import { DB_TYPE_OPTIONS } from "@project/infrastructure/ui/constants/project.module.constants";

interface NewDatabaseModalPropsI {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: () => void;
}

export const NewDatabaseModal: React.FC<NewDatabaseModalPropsI> = memo(
  function NewDatabaseModal({ open, onClose, projectId, onCreated }) {
    const [name, setName] = useState<string>("");
    const [type, setType] = useState<DatabaseType>("postgresql");
    const [serverId, setServerId] = useState<string | null>(null);
    const [replicaSet, setReplicaSet] = useState<boolean>(false);

    const createMutation = trpc.database.create.useMutation({
      onSuccess: (data) => {
        onCreated();
        setName("");
        setServerId(null);
        setReplicaSet(false);
        if (data.connectionString) {
          alert(
            `Database created!\n\nConnection string:\n${data.connectionString}`,
          );
        }
      },
      onError: (err) => alert(err.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createMutation.mutate({
        projectId,
        name,
        type,
        serverId: serverId ?? undefined,
        replicaSet: type === "mongodb" ? replicaSet : false,
      });
    };

    return (
      <Modal open={open} onClose={onClose} title="New Database">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-database"
            required
          />
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as DatabaseType)}
            options={DB_TYPE_OPTIONS}
          />
          <ServerSelector value={serverId} onChange={setServerId} />
          {type === "mongodb" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={replicaSet}
                onChange={(e) => setReplicaSet(e.target.checked)}
                className="rounded border-border bg-surface-2 text-accent focus:ring-accent"
              />
              <span className="text-sm">Enable Replica Set</span>
              <span className="text-xs text-text-muted">
                (required for transactions &amp; change streams)
              </span>
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Database"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  },
);
