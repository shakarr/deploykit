import { memo, useState } from "react";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import { ConfirmDialog } from "@shared/components";

import { trpc } from "@lib/trpc";

import {
  METRIC_LABELS,
  CHANNEL_LABELS,
} from "@metrics/infrastructure/ui/constants/metrics.constants";

interface RuleCardPropsI {
  rule: any;
}

export const RuleCard: React.FC<RuleCardPropsI> = memo(function RuleCard({
  rule,
}) {
  const utils = trpc.useUtils();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggleMutation = trpc.metrics.updateRule.useMutation({
    onSuccess: () => utils.metrics.listRules.invalidate(),
  });
  const deleteMutation = trpc.metrics.deleteRule.useMutation({
    onSuccess: () => {
      utils.metrics.listRules.invalidate();
      utils.metrics.alertStats.invalidate();
    },
  });

  const opLabel = rule.operator === "gt" ? ">" : "<";
  const metricLabel = METRIC_LABELS[rule.metric] ?? rule.metric;
  const channelLabel = CHANNEL_LABELS[rule.channel] ?? rule.channel;

  return (
    <>
      <div
        className={`border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 ${!rule.enabled ? "opacity-60" : ""}`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {rule.serviceName ?? rule.serviceId?.slice(0, 8)}
            <span className="text-text-muted font-normal ml-1">
              ({rule.serviceType})
            </span>
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {metricLabel} {opLabel} {rule.threshold}%
            <span className="mx-1.5 text-text-muted">·</span>
            {channelLabel}
            <span className="mx-1.5 text-text-muted">·</span>
            {rule.cooldownMinutes}min cooldown
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            className="text-text-muted hover:text-text-primary transition-colors"
            onClick={() =>
              toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled })
            }
            title={rule.enabled ? "Disable rule" : "Enable rule"}
          >
            {rule.enabled ? (
              <ToggleRight className="w-5 h-5 text-accent" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
          <button
            className="text-text-muted hover:text-danger transition-colors"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate({ id: rule.id })}
        title="Delete alert rule"
        description={`Remove the alert rule for "${rule.serviceName ?? rule.serviceId}"? Existing events won't be deleted.`}
        confirmText="Delete rule"
        isPending={deleteMutation.isPending}
      />
    </>
  );
});
