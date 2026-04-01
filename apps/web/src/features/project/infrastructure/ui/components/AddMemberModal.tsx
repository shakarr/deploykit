import { memo, useState } from "react";

import { Modal, Button } from "@shared/components";

import { trpc } from "@lib/trpc";

interface AddMemberModalPropsI {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export const AddMemberModal: React.FC<AddMemberModalPropsI> = memo(
  function AddMemberModal({ open, onClose, projectId }) {
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedRole, setSelectedRole] = useState("viewer");
    const utils = trpc.useUtils();

    const { data: availableUsers = [], isLoading } =
      trpc.projectMember.availableUsers.useQuery(
        { projectId },
        { enabled: open },
      );

    const addMutation = trpc.projectMember.add.useMutation({
      onSuccess: () => {
        utils.projectMember.list.invalidate({ projectId });
        utils.projectMember.availableUsers.invalidate({ projectId });
        setSelectedUserId("");
        setSelectedRole("viewer");
        onClose();
      },
    });

    const handleSubmit = () => {
      if (!selectedUserId) return;
      addMutation.mutate({
        projectId,
        userId: selectedUserId,
        role: selectedRole as any,
      });
    };

    return (
      <Modal open={open} onClose={onClose} title="Add Project Member">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Assign a user a specific role for this project. This overrides their
            global role within this project only.
          </p>

          {/* User selector */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              User
            </label>
            {isLoading ? (
              <p className="text-xs text-text-muted">Loading users…</p>
            ) : availableUsers.length === 0 ? (
              <p className="text-xs text-text-muted">
                No users available to add. All non-admin users are already
                members of this project.
              </p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">Select a user…</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} ({u.role})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Project role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    value: "viewer",
                    label: "Viewer",
                    desc: "Read-only access",
                  },
                  {
                    value: "operator",
                    label: "Operator",
                    desc: "Deploy, manage env vars",
                  },
                  {
                    value: "admin",
                    label: "Admin",
                    desc: "Full access + manage members",
                  },
                ] as const
              ).map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  className={`px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    selectedRole === r.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface-1 text-text-secondary hover:border-border-hover"
                  }`}
                >
                  <span className="text-xs font-medium block">{r.label}</span>
                  <span className="text-[11px] text-text-muted block mt-0.5">
                    {r.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {addMutation.error && (
            <p className="text-xs text-danger">{addMutation.error.message}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedUserId || addMutation.isPending}
            >
              {addMutation.isPending ? "Adding…" : "Add Member"}
            </Button>
          </div>
        </div>
      </Modal>
    );
  },
);
