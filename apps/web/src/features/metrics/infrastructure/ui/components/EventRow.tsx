import { memo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { timeAgo } from "@lib/utils";

import {
  formatValue,
  severityColor,
} from "@metrics/infrastructure/ui/utils/metrics.utils";

interface EventRowPropsI {
  event: any;
}

export const EventRow: React.FC<EventRowPropsI> = memo(function EventRow({
  event,
}) {
  const isOpen = !event.resolvedAt;
  return (
    <tr className="border-b border-border text-sm">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          )}
          <span
            className={
              isOpen ? "font-medium text-text-primary" : "text-text-secondary"
            }
          >
            {event.message}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
            isOpen
              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
              : "bg-green-50  text-green-700  dark:bg-green-900/20  dark:text-green-400"
          }`}
        >
          {isOpen ? "Open" : "Resolved"}
        </span>
      </td>
      <td
        className={`px-4 py-3 whitespace-nowrap text-xs font-mono ${severityColor(event.metric, event.value)}`}
      >
        {formatValue(event.metric, event.value)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-text-muted">
        {event.serviceName ?? event.serviceId?.slice(0, 8)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-text-muted">
        {timeAgo(event.createdAt)}
        {event.resolvedAt && (
          <span className="ml-2 text-text-muted">
            · resolved {timeAgo(event.resolvedAt)}
          </span>
        )}
      </td>
    </tr>
  );
});
