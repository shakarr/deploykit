const getStoredLogs = (
  deployments: any[] | undefined,
  id: string,
): string[] => {
  const d = deployments?.find((d) => d.id === id);
  if (!d) return [];
  const combined = (d.buildLogs || "") + (d.deployLogs || "");
  return combined ? combined.split("\n") : ["No logs available."];
};

export { getStoredLogs };
