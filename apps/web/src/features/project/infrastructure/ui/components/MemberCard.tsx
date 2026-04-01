import { memo, useState } from "react";
import { User, Trash2, ChevronDown } from "lucide-react";

import { Button, ConfirmDialog } from "@shared/components";

import { trpc } from "@lib/trpc";
import { ROLE_STYLES } from "@project/infrastructure/ui/constants/project.module.constants";

interface MemberCardPropsI {
  member: {
    id: string;
    userId: string;
    email: string;
    role: string;
    globalRole: string;
  };
  projectId: string;
  canManage: boolean;
}

export const MemberCard: React.FC<MemberCardPropsI> = memo(function MemberCard({
  member,
  projectId,
  canManage,
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.projectMember.updateRole.useMutation({
    onSuccess: () => {
      utils.projectMember.list.invalidate({ projectId });
      setShowRoleMenu(false);
    },
  });

  const removeMutation = trpc.projectMember.remove.useMutation({
    onSuccess: () => {
      utils.projectMember.list.invalidate({ projectId });
      utils.projectMember.availableUsers.invalidate({ projectId });
      setShowDelete(false);
    },
  });

  const style = ROLE_STYLES[member.role] || ROLE_STYLES.viewer!;

  return (
    <>
      <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-text-muted" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className="text-sm truncate block">{member.email}</span>
          <span className="text-[11px] text-text-muted">
            Global: {member.globalRole}
          </span>
        </div>

        {/* Role badge / selector */}
        {canManage ? (
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded ${style.bg} ${style.text}`}
            >
              {style.label}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface-1 border border-border rounded-lg shadow-lg py-1 min-w-30">
                  {(["admin", "operator", "viewer"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() =>
                        updateRoleMutation.mutate({ id: member.id, role: r })
                      }
                      disabled={
                        r === member.role || updateRoleMutation.isPending
                      }
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-2 transition-colors ${
                        r === member.role
                          ? "text-text-muted"
                          : "text-text-primary"
                      }`}
                    >
                      {ROLE_STYLES[r]?.label || r}
                      {r === member.role && " ✓"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <span
            className={`text-[11px] font-medium px-2 py-1 rounded ${style.bg} ${style.text}`}
          >
            {style.label}
          </span>
        )}

        {/* Delete */}
        {canManage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDelete(true)}
            title="Remove member"
          >
            <Trash2 className="w-3.5 h-3.5 text-danger" />
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => removeMutation.mutate({ id: member.id })}
        title="Remove Member"
        description={`Remove ${member.email} from this project? They will fall back to their global role (${member.globalRole}).`}
        confirmText="Remove"
        isPending={removeMutation.isPending}
      />
    </>
  );
});
