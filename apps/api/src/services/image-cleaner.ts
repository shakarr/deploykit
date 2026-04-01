import { desc, eq } from "drizzle-orm";
import { docker } from "../lib/docker";
import { db } from "../db/index";
import { applications, deployments, servers } from "../db/schema/index";
import { getDockerForServer } from "./docker-factory";
import type { RemoteDockerService } from "./remote-docker";

// How many successful deployment images to keep per application (plus the live one)
const DEFAULT_KEEP = 3;

export interface CleanupResultI {
  serverId: string | null; // null = local
  serverName: string;
  imagesRemoved: number;
  bytesFreed: number;
  errors: string[];
  dryRun: boolean;
}

/**
 * Remove stale deploykit/* images from a single server.
 *
 * Safe-set = images currently used by a running container
 *           + the N most recent successful deployment images per app
 *
 * Everything else in the deploykit/* namespace is removed.
 */
const pruneServerImages = async (opts: {
  serverId?: string | null;
  keep?: number;
  dryRun?: boolean;
}): Promise<CleanupResultI> => {
  const keep = opts.keep ?? DEFAULT_KEEP;
  const dryRun = opts.dryRun ?? false;

  // Resolve server name
  let serverName = "Local";
  if (opts.serverId) {
    const srv = await db.query.servers.findFirst({
      where: eq(servers.id, opts.serverId),
      columns: { name: true },
    });
    serverName = srv?.name ?? opts.serverId.slice(0, 8);
  }

  const result: CleanupResultI = {
    serverId: opts.serverId ?? null,
    serverName,
    imagesRemoved: 0,
    bytesFreed: 0,
    errors: [],
    dryRun,
  };

  // All images currently running on containers assigned to this server
  const runningApps = await db.query.applications.findMany({
    where: opts.serverId
      ? eq(applications.serverId, opts.serverId)
      : eq(applications.status, "running"),
    columns: { containerImage: true, serverId: true },
  });

  const safeImages = new Set<string>(
    runningApps.filter((a) => a.containerImage).map((a) => a.containerImage!),
  );

  // Last N successful deployments per app (images needed for rollback)
  const allApps = await db.query.applications.findMany({
    where: opts.serverId ? eq(applications.serverId, opts.serverId) : undefined,
    columns: { id: true },
  });

  for (const app of allApps) {
    const recent = await db.query.deployments.findMany({
      where: eq(deployments.applicationId, app.id),
      orderBy: [desc(deployments.createdAt)],
      limit: keep,
      columns: { imageName: true, status: true },
    });

    for (const d of recent) {
      if (d.imageName && d.status === "success") {
        safeImages.add(d.imageName);
      }
    }
  }

  // List and filter images on the target server
  if (!opts.serverId) {
    await pruneLocal(safeImages, result, dryRun);
  } else {
    await pruneRemote(opts.serverId, safeImages, result, dryRun);
  }

  return result;
};

const pruneLocal = async (
  safeImages: Set<string>,
  result: CleanupResultI,
  dryRun: boolean,
): Promise<void> => {
  let images: any[];
  try {
    images = await docker.listImages({
      filters: { reference: ["deploykit/*"] },
    });
  } catch (err: any) {
    result.errors.push(`List images failed: ${err.message}`);
    return;
  }

  for (const img of images) {
    const tags: string[] = img.RepoTags ?? [];

    // Keep if any tag is in the safe set
    if (tags.some((t) => safeImages.has(t))) continue;

    // Skip untagged dangling images with no name
    if (tags.length === 0 || tags.every((t) => t === "<none>:<none>")) {
      // Dangling image — safe to remove
    }

    if (dryRun) {
      result.imagesRemoved++;
      result.bytesFreed += img.Size ?? 0;
      continue;
    }

    try {
      const image = docker.getImage(img.Id);
      await image.remove({ force: false });
      result.imagesRemoved++;
      result.bytesFreed += img.Size ?? 0;
    } catch (err: any) {
      // "image is being used" — skip gracefully
      if (
        !err.message?.includes("image is being used") &&
        !err.message?.includes("conflict")
      ) {
        result.errors.push(
          `Failed to remove ${tags[0] ?? img.Id.slice(7, 19)}: ${err.message}`,
        );
      }
    }
  }

  // Also prune dangling (untagged) images as a bonus sweep
  if (!dryRun) {
    try {
      const pruned = (await docker.pruneImages({
        filters: { dangling: ["true"] },
      })) as any;
      result.bytesFreed += pruned?.SpaceReclaimed ?? 0;
    } catch {
      // Non-fatal
    }
  }
};

const pruneRemote = async (
  serverId: string,
  safeImages: Set<string>,
  result: CleanupResultI,
  dryRun: boolean,
): Promise<void> => {
  let remote: RemoteDockerService;
  try {
    const { docker: d, isRemote } = await getDockerForServer(serverId);
    if (!isRemote) {
      await pruneLocal(safeImages, result, dryRun);
      return;
    }
    remote = d as RemoteDockerService;
  } catch (err: any) {
    result.errors.push(`SSH connection failed: ${err.message}`);
    return;
  }

  // List deploykit images on remote
  const { exec } = remote as any;
  let rawLines: string;
  try {
    const listResult = await (remote as any).exec(
      `docker images --format "{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}}" | grep "^deploykit/" || true`,
      30_000,
    );
    rawLines = listResult.stdout ?? "";
  } catch (err: any) {
    result.errors.push(`List images failed on remote: ${err.message}`);
    return;
  }

  for (const line of rawLines
    .split("\n")
    .map((l: string) => l.trim())
    .filter(Boolean)) {
    const parts = line.split(" ");
    const tag = parts[0] ?? "";
    const id = parts[1] ?? "";

    if (!tag || tag === "<none>:<none>") continue;
    if (safeImages.has(tag)) continue;

    if (dryRun) {
      result.imagesRemoved++;
      continue;
    }

    try {
      const rmResult = await (remote as any).exec(
        `docker rmi ${id} 2>&1 || true`,
        30_000,
      );
      if (
        !rmResult.stdout.includes("Error") &&
        !rmResult.stderr?.includes("image is being used")
      ) {
        result.imagesRemoved++;
      }
    } catch (err: any) {
      result.errors.push(`Failed to remove ${tag}: ${err.message}`);
    }
  }

  // Prune dangling remote
  if (!dryRun) {
    try {
      await (remote as any).exec(`docker image prune -f 2>&1 || true`, 30_000);
    } catch {
      // Non-fatal
    }
  }
};

const pruneAllServers = async (opts: {
  keep?: number;
  dryRun?: boolean;
}): Promise<CleanupResultI[]> => {
  const allServers = await db.query.servers.findMany({
    columns: { id: true, name: true, isLocal: true },
  });

  const results = await Promise.allSettled([
    // Local (null serverId)
    pruneServerImages({ serverId: null, ...opts }),
    // All registered servers
    ...allServers
      .filter((s) => !s.isLocal)
      .map((s) => pruneServerImages({ serverId: s.id, ...opts })),
  ]);

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          serverId: null,
          serverName: "unknown",
          imagesRemoved: 0,
          bytesFreed: 0,
          errors: [
            (r as PromiseRejectedResult).reason?.message ?? "Unknown error",
          ],
          dryRun: opts.dryRun ?? false,
        },
  );
};

export { pruneAllServers, pruneServerImages };
