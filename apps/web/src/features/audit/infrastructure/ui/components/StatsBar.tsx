import { Activity } from "lucide-react";

import { Card } from "@shared/components";

import { trpc } from "@lib/trpc";

export const StatsBar = () => {
  const { data } = trpc.audit.stats.useQuery();

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        { label: "Events (24h)", value: data.last24h },
        { label: "Events (7d)", value: data.last7d },
        { label: "Deploys (7d)", value: data.deployments7d },
      ].map((s) => (
        <Card key={s.label}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs text-text-secondary">{s.label}</p>
              <p className="text-2xl font-semibold mt-1">{s.value}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-text-muted">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
