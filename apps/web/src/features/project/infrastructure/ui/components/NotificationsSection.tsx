import { memo, useState } from "react";
import { Bell, Plus } from "lucide-react";

import { Button, Card, EmptyState } from "@shared/components";
import {
  NotificationChannelCard,
  NotificationChannelModal,
} from "@project/infrastructure/ui/components";

import { trpc } from "@lib/trpc";
import { useAuthStore } from "@lib/auth";

interface NotificationsSectionPropsI {
  projectId: string;
}

export const NotificationsSection: React.FC<NotificationsSectionPropsI> = memo(
  function NotificationsSection({ projectId }) {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editChannel, setEditChannel] = useState<any>(null);

    const canWrite = useAuthStore((s) => s.canWrite)();

    const { data: channels = [], isLoading } = trpc.notification.list.useQuery({
      projectId,
    });

    const handleEdit = (channel: any) => {
      setEditChannel(channel);
      setShowModal(true);
    };

    const handleClose = () => {
      setShowModal(false);
      setEditChannel(null);
    };

    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Notifications
          </h2>
          {canWrite && channels.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditChannel(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Channel
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-xs text-text-muted">Loading…</p>
        ) : channels.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Bell className="w-6 h-6" />}
              title="No notification channels"
              description="Add a channel to receive alerts on deploy, failures, and more."
              action={
                canWrite ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditChannel(null);
                      setShowModal(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Channel
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {channels.map((channel) => (
              <NotificationChannelCard
                key={channel.id}
                channel={channel as any}
                projectId={projectId}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        <NotificationChannelModal
          open={showModal}
          onClose={handleClose}
          projectId={projectId}
          editChannel={editChannel}
        />
      </section>
    );
  },
);
