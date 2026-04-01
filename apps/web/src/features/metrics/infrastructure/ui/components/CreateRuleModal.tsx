import React, { memo, useState } from "react";

import { Button, Input, Select, Modal } from "@shared/components";

import { trpc } from "@lib/trpc";

import {
  METRIC_OPTIONS,
  OPERATOR_OPTIONS,
  CHANNEL_OPTIONS,
  SERVICE_TYPE_OPTIONS,
} from "@metrics/infrastructure/ui/constants/metrics.constants";

interface CreateRuleModalPropsI {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateRuleModal: React.FC<CreateRuleModalPropsI> = memo(
  function CreateRuleModal({ open, onClose, onCreated }) {
    const utils = trpc.useUtils();
    const [form, setForm] = useState({
      serviceType: "application" as "application" | "database",
      serviceId: "",
      metric: "cpu",
      operator: "gt",
      threshold: 85,
      channel: "ui",
      channelUrl: "",
      cooldown: 15,
    });

    // Build service list from existing projects
    const { data: projects } = trpc.project.list.useQuery();
    const allServices = (projects ?? []).flatMap((p) => [
      ...(p.applications ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        type: "application" as const,
      })),
      ...(p.databases ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        type: "database" as const,
      })),
    ]);

    const serviceOptions = allServices
      .filter((s) => s.type === form.serviceType)
      .map((s) => ({ value: s.id, label: s.name }));

    const mutation = trpc.metrics.createRule.useMutation({
      onSuccess: () => {
        utils.metrics.listRules.invalidate();
        utils.metrics.alertStats.invalidate();
        onCreated();
        onClose();
      },
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const svc = allServices.find((s) => s.id === form.serviceId);
      mutation.mutate({
        serviceType: form.serviceType,
        serviceId: form.serviceId,
        serviceName: svc?.name,
        metric: form.metric as any,
        operator: form.operator as any,
        threshold: form.threshold,
        channel: form.channel as any,
        channelConfig: form.channelUrl ? { url: form.channelUrl } : undefined,
        cooldownMinutes: form.cooldown,
      });
    };

    const needsUrl = form.channel === "slack" || form.channel === "webhook";

    return (
      <Modal open={open} onClose={onClose} title="New alert rule">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Service type"
              value={form.serviceType}
              options={SERVICE_TYPE_OPTIONS}
              onChange={(e) =>
                setForm({
                  ...form,
                  serviceType: e.target.value as any,
                  serviceId: "",
                })
              }
            />

            <Select
              label="Service"
              value={form.serviceId}
              options={[
                { value: "", label: "Select service…" },
                ...serviceOptions,
              ]}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Select
              label="Metric"
              value={form.metric}
              options={METRIC_OPTIONS}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
            />

            <Select
              label="Condition"
              value={form.operator}
              options={OPERATOR_OPTIONS}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
            />

            <Input
              label="Threshold (%)"
              type="number"
              min={0}
              max={100}
              value={form.threshold}
              onChange={(e) =>
                setForm({ ...form, threshold: Number(e.target.value) })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Notification channel"
              value={form.channel}
              options={CHANNEL_OPTIONS}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
            />

            <Input
              label="Cooldown (minutes)"
              type="number"
              min={1}
              max={1440}
              value={form.cooldown}
              onChange={(e) =>
                setForm({ ...form, cooldown: Number(e.target.value) })
              }
            />
          </div>

          {needsUrl && (
            <Input
              label={
                form.channel === "slack" ? "Slack webhook URL" : "Webhook URL"
              }
              type="url"
              value={form.channelUrl}
              onChange={(e) => setForm({ ...form, channelUrl: e.target.value })}
              placeholder="https://"
              required
            />
          )}

          {mutation.error && (
            <p className="text-sm text-danger">{mutation.error.message}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !form.serviceId}
            >
              {mutation.isPending ? "Creating…" : "Create rule"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  },
);
