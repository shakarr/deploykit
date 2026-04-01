import {
  DatabaseStatusT,
  DatabaseTypeT,
} from "@database/infrastructure/ui/types/database.module.types";

interface DatabaseI {
  id: string;
  name: string;
  type: DatabaseTypeT;
  status: DatabaseStatusT;
  version?: string;
  internalPort: number;
  containerId?: string;
  connectionString?: string;
  dbUser?: string;
  replicaSet: boolean;
  backupEnabled: boolean;
  backupCron?: string;
  backupRetention?: number;
}

interface BackupI {
  filename: string;
  size: number;
  createdAt: string | Date;
}

interface DatabaseStatsI {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percent: number;
  };
}

export type { DatabaseI, BackupI, DatabaseStatsI };
