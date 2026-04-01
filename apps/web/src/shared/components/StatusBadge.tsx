import { memo } from "react";

import { cn, statusColors } from "@lib/utils";

interface StatusBadgePropsI {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgePropsI> = memo(
  function StatusBadge({ status }) {
    const dotColor = statusColors[status] || "bg-text-muted";
    const isActive = ["running", "building", "deploying", "queued"].includes(
      status,
    );

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            dotColor,
            isActive && "status-pulse",
          )}
        />
        {status}
      </span>
    );
  },
);
