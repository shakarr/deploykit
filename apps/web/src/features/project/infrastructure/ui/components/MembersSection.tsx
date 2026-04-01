import { memo, useState } from "react";
import { Users, Plus, Shield } from "lucide-react";

import { Button, Card, EmptyState } from "@shared/components";
import {
  MemberCard,
  AddMemberModal,
} from "@project/infrastructure/ui/components";

import { trpc } from "@lib/trpc";
import { useAuthStore } from "@lib/auth";

interface MembersSectionPropsI {
  projectId: string;
}

export const MembersSection: React.FC<MembersSectionPropsI> = memo(
  function MembersSection({ projectId }) {
    const [showModal, setShowModal] = useState(false);

    const globalRole = useAuthStore((s) => s.user?.role);

    const { data: myRole } = trpc.projectMember.myRole.useQuery({ projectId });
    const { data: members = [], isLoading } = trpc.projectMember.list.useQuery({
      projectId,
    });

    const effectiveRole = myRole?.role || globalRole || "viewer";
    const canManage = effectiveRole === "admin";

    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Members
          </h2>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Member
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-xs text-text-muted">Loading…</p>
        ) : members.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No project-specific members"
              description="All users use their global role for this project. Add members to assign project-specific roles."
              action={
                canManage ? (
                  <Button size="sm" onClick={() => setShowModal(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    Add Member
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <Card>
            {/* Header hint */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
              <Shield className="w-3 h-3 text-text-muted" />
              <span className="text-[11px] text-text-muted">
                These roles override global roles for this project only
              </span>
            </div>
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                projectId={projectId}
                canManage={canManage}
              />
            ))}
          </Card>
        )}

        <AddMemberModal
          open={showModal}
          onClose={() => setShowModal(false)}
          projectId={projectId}
        />
      </section>
    );
  },
);
