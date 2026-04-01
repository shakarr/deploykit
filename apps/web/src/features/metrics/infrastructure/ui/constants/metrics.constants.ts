const METRIC_OPTIONS = [
  { value: "cpu", label: "CPU %" },
  { value: "memory", label: "Memory %" },
  { value: "net_rx", label: "Net RX (bytes)" },
  { value: "net_tx", label: "Net TX (bytes)" },
];

const METRIC_LABELS: Record<string, string> = Object.fromEntries(
  METRIC_OPTIONS.map((o) => [o.value, o.label]),
);

const OPERATOR_OPTIONS = [
  { value: "gt", label: "Greater than" },
  { value: "lt", label: "Less than" },
];

const CHANNEL_OPTIONS = [
  { value: "ui", label: "In-app" },
  { value: "slack", label: "Slack" },
  { value: "webhook", label: "Webhook" },
];

const CHANNEL_LABELS: Record<string, string> = Object.fromEntries(
  CHANNEL_OPTIONS.map((o) => [o.value, o.label]),
);

const SERVICE_TYPE_OPTIONS = [
  { value: "application", label: "Application" },
  { value: "database", label: "Database" },
];

export {
  METRIC_OPTIONS,
  METRIC_LABELS,
  OPERATOR_OPTIONS,
  CHANNEL_OPTIONS,
  CHANNEL_LABELS,
  SERVICE_TYPE_OPTIONS,
};
