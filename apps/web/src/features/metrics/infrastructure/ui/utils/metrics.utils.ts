const severityColor = (metric: string, value: number) => {
  if (metric === "cpu" || metric === "memory") {
    if (value >= 90) return "text-red-500";
    if (value >= 75) return "text-yellow-500";
  }
  return "text-text-secondary";
};

const formatValue = (metric: string, value: number) => {
  if (metric === "cpu" || metric === "memory") return `${value.toFixed(1)}%`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
};

export { severityColor, formatValue };
