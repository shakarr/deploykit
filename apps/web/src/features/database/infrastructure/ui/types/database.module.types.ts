type DatabaseStatusT = "running" | "stopped" | "error" | string;

type DatabaseTypeT = "postgresql" | "mongodb" | "redis" | "mysql" | "mariadb";

type TabT = "connection" | "backups" | "monitoring";

export type { DatabaseStatusT, DatabaseTypeT, TabT };
