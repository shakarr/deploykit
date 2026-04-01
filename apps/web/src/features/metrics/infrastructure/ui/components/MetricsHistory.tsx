import { memo } from "react";

import { MetricCard } from "@metrics/infrastructure/ui/components";

import { trpc } from "@lib/trpc";
import { formatBytes } from "@lib/utils";
import { useServiceMetrics } from "@lib/socket";

interface MetricsHistoryPropsI {
  serviceId: string;
  containerId: string | null;
}

export const MetricsHistory: React.FC<MetricsHistoryPropsI> = memo(
  function MetricsHistory({ serviceId }) {
    const { data: history, isLoading } = trpc.metrics.history.useQuery(
      { serviceId },
      { refetchInterval: 30_000 },
    );

    // Live update via Socket.IO (replaces polling when user is watching)
    const live = useServiceMetrics(serviceId);

    if (isLoading) {
      return <p className="text-sm text-text-muted py-4">Loading metrics…</p>;
    }

    if (!history?.length && !live) {
      return (
        <p className="text-sm text-text-muted py-4">
          No metrics yet. Data is collected every 30 seconds while the service
          is running.
        </p>
      );
    }

    // Merge history + live point (avoid duplicates by ts)
    const allSamples =
      live && (!history?.length || history[history.length - 1]?.ts !== live.ts)
        ? [...(history ?? []), { ...live }]
        : (history ?? []);

    // Use live data for current values if available, fallback to last history point
    const latest = live ?? allSamples[allSamples.length - 1];

    const cpuData = allSamples.map((s) => s.cpu);
    const memData = allSamples.map((s) => s.memPercent);
    const netRxData = allSamples.map((s) => s.netRx);
    const netTxData = allSamples.map((s) => s.netTx);

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="CPU"
            value={`${latest?.cpu.toFixed(1) ?? "–"}%`}
            barPercent={latest?.cpu ?? 0}
            sparkData={cpuData}
            color="#378ADD"
          />
          <MetricCard
            label="Memory"
            value={`${latest?.memPercent.toFixed(1) ?? "–"}%`}
            subValue={
              latest
                ? `${formatBytes(latest.memUsed)} / ${formatBytes(latest.memTotal)}`
                : undefined
            }
            barPercent={latest?.memPercent ?? 0}
            sparkData={memData}
            color="#1D9E75"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Network RX"
            value={latest ? formatBytes(latest.netRx) : "–"}
            barPercent={0}
            sparkData={netRxData}
            color="#7F77DD"
            unit="bytes"
          />
          <MetricCard
            label="Network TX"
            value={latest ? formatBytes(latest.netTx) : "–"}
            barPercent={0}
            sparkData={netTxData}
            color="#D85A30"
            unit="bytes"
          />
        </div>

        {allSamples.length > 0 && (
          <p className="text-xs text-text-muted text-right">
            {allSamples.length} samples · last 30 min · updates every 30s
          </p>
        )}
      </div>
    );
  },
);
