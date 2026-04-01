import { memo } from "react";

import { Sparkline } from "@metrics/infrastructure/ui/components";

interface MetricCardPropsI {
  label: string;
  value: string;
  subValue?: string;
  barPercent: number;
  sparkData: number[];
  color: string;
  unit?: string;
}

export const MetricCard: React.FC<MetricCardPropsI> = memo(function MetricCard({
  label,
  value,
  subValue,
  barPercent,
  sparkData,
  color,
  unit = "%",
}) {
  const clamped = Math.min(Math.max(barPercent, 0), 100);
  const barColor =
    clamped >= 90
      ? "bg-red-500"
      : clamped >= 75
        ? "bg-yellow-500"
        : "bg-accent";

  return (
    <div className="bg-surface-1 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-semibold mt-0.5">{value}</p>
          {subValue && (
            <p className="text-xs text-text-secondary mt-0.5">{subValue}</p>
          )}
        </div>
        <Sparkline data={sparkData} color={color} />
      </div>

      {unit === "%" && (
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
      )}
    </div>
  );
});
