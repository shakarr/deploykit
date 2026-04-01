import { Activity } from "lucide-react";

import { Card } from "@shared/components";

import { trpc } from "@lib/trpc";

export const StatsBanner: React.FC = () => {
  const { data } = trpc.metrics.alertStats.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        {
          label: "Open alerts",
          value: data?.openAlerts ?? "–",
          danger: (data?.openAlerts ?? 0) > 0,
        },
        {
          label: "Total events",
          value: data?.totalEvents ?? "–",
          danger: false,
        },
        {
          label: "Active rules",
          value: data?.activeRules ?? "–",
          danger: false,
        },
      ].map((s) => (
        <Card key={s.label}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs text-text-secondary">{s.label}</p>
              <p
                className={`text-2xl font-semibold mt-1 ${s.danger ? "text-danger" : ""}`}
              >
                {s.value}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
              <Activity className="w-5 h-5 text-text-muted" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
