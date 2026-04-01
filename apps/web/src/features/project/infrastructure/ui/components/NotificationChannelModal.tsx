import { useState, useEffect, memo } from "react";

import { Modal, Button, Input } from "@shared/components";

import { trpc } from "@lib/trpc";
import {
  ALL_EVENTS,
  CHANNEL_TYPES,
} from "@project/infrastructure/ui/constants/project.module.constants";

type ChannelTypeT = keyof typeof CHANNEL_TYPES;

interface NotificationChannelModalPropsI {
  open: boolean;
  onClose: () => void;
  projectId: string;
  editChannel?: {
    id: string;
    name: string;
    type: string;
    config: Record<string, string>;
    events: string[];
  } | null;
}

export const NotificationChannelModal: React.FC<NotificationChannelModalPropsI> =
  memo(function NotificationChannelModal({
    open,
    onClose,
    projectId,
    editChannel,
  }) {
    const isEditing = !!editChannel;
    const utils = trpc.useUtils();

    const [name, setName] = useState("");
    const [type, setType] = useState<ChannelTypeT>("discord");
    const [config, setConfig] = useState<Record<string, string>>({});
    const [selectedEvents, setSelectedEvents] = useState<string[]>([
      "deploy.success",
      "deploy.failed",
    ]);

    // Populate form when editing
    useEffect(() => {
      if (editChannel) {
        setName(editChannel.name);
        setType(editChannel.type as ChannelTypeT);
        setConfig(editChannel.config);
        setSelectedEvents(editChannel.events);
      } else {
        setName("");
        setType("discord");
        setConfig({});
        setSelectedEvents(["deploy.success", "deploy.failed"]);
      }
    }, [editChannel, open]);

    const createMutation = trpc.notification.create.useMutation({
      onSuccess: () => {
        utils.notification.list.invalidate({ projectId });
        onClose();
      },
    });

    const updateMutation = trpc.notification.update.useMutation({
      onSuccess: () => {
        utils.notification.list.invalidate({ projectId });
        onClose();
      },
    });

    const testMutation = trpc.notification.test.useMutation();

    const isPending = createMutation.isPending || updateMutation.isPending;
    const error = createMutation.error || updateMutation.error;

    const channelConfig = CHANNEL_TYPES[type];

    const handleConfigChange = (key: string, value: string) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    };

    const toggleEvent = (event: string) => {
      setSelectedEvents((prev) =>
        prev.includes(event)
          ? prev.filter((e) => e !== event)
          : [...prev, event],
      );
    };

    const handleSubmit = () => {
      if (!name.trim() || selectedEvents.length === 0) return;

      if (isEditing) {
        updateMutation.mutate({
          id: editChannel!.id,
          name: name.trim(),
          config,
          events: selectedEvents as any,
        });
      } else {
        createMutation.mutate({
          projectId,
          name: name.trim(),
          type,
          config,
          events: selectedEvents as any,
          enabled: true,
        });
      }
    };

    const handleTest = () => {
      testMutation.mutate({ type, config });
    };

    return (
      <Modal
        open={open}
        onClose={onClose}
        title={isEditing ? "Edit Channel" : "Add Notification Channel"}
      >
        <div className="space-y-4">
          {/* Name */}
          <Input
            label="Channel name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Deploy alerts, Team Discord"
            autoFocus
          />

          {/* Type selector (only on create) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Channel type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(CHANNEL_TYPES) as ChannelTypeT[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      setConfig({});
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      type === t
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-surface-1 text-text-secondary hover:border-border-hover"
                    }`}
                  >
                    {CHANNEL_TYPES[t].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Config fields */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary">
              Configuration
            </label>
            {channelConfig.fields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                value={config[field.key] || ""}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            ))}
          </div>

          {/* Events */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Events to notify ({selectedEvents.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_EVENTS.map((event) => {
                const isSelected = selectedEvents.includes(event.value);
                return (
                  <button
                    key={event.value}
                    onClick={() => toggleEvent(event.value)}
                    className={`px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                      isSelected
                        ? "bg-accent/10 text-accent border border-accent/30"
                        : "bg-surface-2 text-text-muted border border-transparent hover:text-text-secondary"
                    }`}
                  >
                    {event.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-xs text-danger">{error.message}</p>}

          {/* Test result */}
          {testMutation.data && (
            <p
              className={`text-xs ${
                testMutation.data.success ? "text-green-400" : "text-danger"
              }`}
            >
              {testMutation.data.success
                ? "✓ Test sent successfully!"
                : `✗ Test failed: ${testMutation.data.error}`}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTest}
              disabled={testMutation.isPending || !name.trim()}
            >
              {testMutation.isPending ? "Sending…" : "Send Test"}
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isPending || !name.trim() || selectedEvents.length === 0
                }
              >
                {isPending
                  ? "Saving…"
                  : isEditing
                    ? "Save Changes"
                    : "Add Channel"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  });
