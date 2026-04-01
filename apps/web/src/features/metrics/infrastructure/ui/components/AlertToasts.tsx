import { AlertTriangle, X } from "lucide-react";

import { useAlertNotifications } from "@lib/socket";

export const AlertToasts: React.FC = () => {
  const { alerts, dismiss } = useAlertNotifications();

  if (!alerts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {alerts.map((alert) => (
        <div
          key={alert.eventId}
          className="flex items-start gap-3 bg-surface-1 border border-yellow-500/30 rounded-xl shadow-lg p-4"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">Alert fired</p>
            <p className="text-xs text-text-secondary mt-0.5 wrap-break-word">
              {alert.message}
            </p>
          </div>
          <button
            onClick={() => dismiss(alert.eventId)}
            className="text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
