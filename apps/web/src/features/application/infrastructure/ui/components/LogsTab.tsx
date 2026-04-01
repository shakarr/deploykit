import { memo } from "react";

import { Card } from "@shared/components";
import { LogViewer } from "@application/infrastructure/ui/components/LogViewer";

import { trpc } from "@lib/trpc";
import { useContainerLogs } from "@lib/socket";

interface LogsTabPropsI {
  app: any;
}

export const LogsTab: React.FC<LogsTabPropsI> = memo(function LogsTab({ app }) {
  const { data: logsData } = trpc.application.logs.useQuery(
    { id: app.id, tail: 200 },
    { enabled: !!app.containerId },
  );
  const { logs: liveLogs } = useContainerLogs(app.containerId);

  const allLogs = [
    ...(logsData?.logs ? logsData.logs.split("\n") : []),
    ...liveLogs,
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Container Logs</h3>
        {!app.containerId && (
          <span className="text-xs text-text-muted">No running container</span>
        )}
      </div>
      <LogViewer
        lines={
          allLogs.length > 0
            ? allLogs
            : ["No logs available. Deploy your application first."]
        }
      />
    </Card>
  );
});
