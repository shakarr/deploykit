import { memo, useState } from "react";

import {
  ACTION_LABELS,
  RESOURCE_COLORS,
} from "@audit/infrastructure/ui/constants/audit.constants";
import {
  getActionColor,
  formatDate,
  timeAgo,
} from "@audit/infrastructure/ui/utils/audit.utils";

interface EntryRowI {
  entry: any;
}

export const EntryRow: React.FC<EntryRowI> = memo(function EntryRow({ entry }) {
  const [open, setOpen] = useState(false);
  const label = ACTION_LABELS[entry.action] ?? entry.action;
  const actionColor = getActionColor(entry.action);
  const resourceColor = entry.resourceType
    ? (RESOURCE_COLORS[entry.resourceType] ??
      "bg-surface-2 text-text-secondary")
    : null;
  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;

  return (
    <>
      <tr
        className={`border-b border-border text-sm transition-colors ${hasMetadata ? "cursor-pointer hover:bg-surface-2" : ""}`}
        onClick={() => hasMetadata && setOpen((o) => !o)}
      >
        {/* Time */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className="text-text-primary"
            title={formatDate(entry.createdAt)}
          >
            {timeAgo(entry.createdAt)}
          </span>
        </td>

        {/* User */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono text-xs text-text-secondary">
            {entry.userEmail ?? (
              <span className="italic text-text-muted">system</span>
            )}
          </span>
        </td>

        {/* Action */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`font-medium ${actionColor}`}>{label}</span>
        </td>

        {/* Resource */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {resourceColor && (
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-medium ${resourceColor}`}
              >
                {entry.resourceType}
              </span>
            )}
            {entry.resourceName && (
              <span className="text-text-secondary text-xs truncate max-w-32">
                {entry.resourceName}
              </span>
            )}
          </div>
        </td>

        {/* IP */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono text-xs text-text-muted">{entry.ip}</span>
        </td>

        {/* Expand indicator */}
        <td className="px-4 py-3 text-right">
          {hasMetadata && (
            <span className="text-text-muted text-xs">{open ? "▲" : "▼"}</span>
          )}
        </td>
      </tr>

      {/* Metadata expanded row */}
      {open && hasMetadata && (
        <tr className="bg-surface-2 border-b border-border">
          <td colSpan={6} className="px-6 py-3">
            <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap break-all">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
});
