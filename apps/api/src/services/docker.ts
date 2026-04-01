import { docker, ensureNetwork, connectToNetwork } from "../lib/docker";

interface CreateContainerOptsI {
  name: string;
  image: string;
  env?: string[];
  ports?: Array<{ host: number; container: number }>;
  volumes?: string[];
  networkName?: string;
  labels?: Record<string, string>;
  command?: string[];
  restartPolicy?: string;
  skipPull?: boolean; // Skip pull for locally built images
}

interface ContainerStatsI {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  network: { rx: number; tx: number };
}

export class DockerService {
  /**
   * Pull image, create container, connect to network, start it.
   * Returns the container ID.
   */
  async createAndStart(opts: CreateContainerOptsI): Promise<string> {
    // Ensure network exists
    if (opts.networkName) {
      await ensureNetwork(opts.networkName);
    }

    // Pull image (skip for locally built images)
    if (!opts.skipPull) {
      const localExists = await this.imageExistsLocally(opts.image);
      if (!localExists) {
        await this.pullImage(opts.image);
      }
    }

    // Remove existing container with same name
    try {
      const existing = docker.getContainer(opts.name);
      await existing.stop().catch(() => {});
      await existing.remove({ force: true });
    } catch {
      // Doesn't exist
    }

    // Build port bindings
    const portBindings: Record<string, Array<{ HostPort: string }>> = {};
    const exposedPorts: Record<string, object> = {};

    if (opts.ports) {
      for (const p of opts.ports) {
        const key = `${p.container}/tcp`;
        exposedPorts[key] = {};
        portBindings[key] = [{ HostPort: String(p.host) }];
      }
    }

    // Build volume binds
    const binds = opts.volumes || [];

    // Create container
    const container = await docker.createContainer({
      Image: opts.image,
      name: opts.name,
      Env: opts.env || [],
      ExposedPorts: exposedPorts,
      Labels: opts.labels || {},
      Cmd: opts.command,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds,
        RestartPolicy: { Name: opts.restartPolicy || "unless-stopped" },
      },
    });

    // Connect to network before starting
    if (opts.networkName) {
      await connectToNetwork(container.id, opts.networkName);
    }

    // Start
    await container.start();
    return container.id;
  }

  /**
   * Deploy an application container with Traefik labels for routing
   */
  async deployApp(opts: {
    name: string;
    image: string;
    env: string[];
    port: number;
    domains: Array<{ domain: string; https: boolean; port: number }>;
    labels?: Record<string, string>;
    volumes?: string[];
    skipPull?: boolean;
  }): Promise<string> {
    const traefikLabels: Record<string, string> = {
      "traefik.enable": "true",
      "deploykit.managed": "true",
    };

    // Generate Traefik labels for each domain
    for (let i = 0; i < opts.domains.length; i++) {
      const d = opts.domains[i]!;
      const routerName = `${opts.name}${i > 0 ? `-${i}` : ""}`;

      traefikLabels[`traefik.http.routers.${routerName}.rule`] =
        `Host(\`${d.domain}\`)`;
      traefikLabels[
        `traefik.http.services.${routerName}.loadbalancer.server.port`
      ] = String(d.port);

      if (d.https) {
        traefikLabels[`traefik.http.routers.${routerName}.entrypoints`] =
          "websecure";
        traefikLabels[`traefik.http.routers.${routerName}.tls.certresolver`] =
          "letsencrypt";
        // HTTP → HTTPS redirect
        traefikLabels[`traefik.http.routers.${routerName}-http.rule`] =
          `Host(\`${d.domain}\`)`;
        traefikLabels[`traefik.http.routers.${routerName}-http.entrypoints`] =
          "web";
        traefikLabels[`traefik.http.routers.${routerName}-http.middlewares`] =
          `${routerName}-redirect`;
        traefikLabels[
          `traefik.http.middlewares.${routerName}-redirect.redirectscheme.scheme`
        ] = "https";
      } else {
        traefikLabels[`traefik.http.routers.${routerName}.entrypoints`] = "web";
      }
    }

    return this.createAndStart({
      name: opts.name,
      image: opts.image,
      env: opts.env,
      labels: { ...traefikLabels, ...opts.labels },
      networkName: "deploykit-network",
      volumes: opts.volumes,
      skipPull: opts.skipPull,
    });
  }

  //Container lifecycle
  async start(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.start();
  }

  async stop(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 10 });
  }

  async stopAndRemove(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 10 }).catch(() => {});
    await container.remove({ force: true });
  }

  async restart(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.restart({ t: 10 });
  }

  //Image operations
  async pullImage(imageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      docker.pull(
        imageName,
        (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err: Error | null) => {
            if (err) return reject(err);
            resolve();
          });
        },
      );
    });
  }

  async buildImage(
    contextPath: string,
    tag: string,
    dockerfilePath = "Dockerfile",
    onProgress?: (log: string) => void,
  ): Promise<void> {
    const stream = await docker.buildImage(
      { context: contextPath, src: ["."] },
      { t: tag, dockerfile: dockerfilePath },
    );

    return new Promise((resolve, reject) => {
      docker.modem.followProgress(
        stream,
        (err: Error | null) => {
          if (err) return reject(err);
          resolve();
        },
        (event: any) => {
          if (event.stream && onProgress) {
            onProgress(event.stream);
          }
        },
      );
    });
  }

  async getLogs(containerId: string, tail = 100): Promise<string> {
    try {
      const container = docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        timestamps: true,
        tail,
        follow: false,
      });

      // Docker can return string or Buffer depending on platform/config
      if (typeof logs === "string") return logs;
      if (Buffer.isBuffer(logs)) return this.demuxStream(logs);
      return String(logs);
    } catch (err: any) {
      console.error(`[docker] getLogs failed for ${containerId}:`, err.message);
      return `Error fetching logs: ${err.message}`;
    }
  }

  async getStats(containerId: string): Promise<ContainerStatsI | null> {
    try {
      const container = docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });

      // CPU
      const cpuDelta =
        stats.cpu_stats.cpu_usage.total_usage -
        stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta =
        stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercent =
        systemDelta > 0
          ? (cpuDelta / systemDelta) * (stats.cpu_stats.online_cpus || 1) * 100
          : 0;

      // Memory
      const memUsage =
        stats.memory_stats.usage - (stats.memory_stats.stats?.cache || 0);
      const memPercent =
        stats.memory_stats.limit > 0
          ? (memUsage / stats.memory_stats.limit) * 100
          : 0;

      // Network
      let rx = 0;
      let tx = 0;
      if (stats.networks) {
        for (const net of Object.values(stats.networks) as any[]) {
          rx += net.rx_bytes || 0;
          tx += net.tx_bytes || 0;
        }
      }

      return {
        cpu: Math.round(cpuPercent * 100) / 100,
        memory: {
          used: memUsage,
          total: stats.memory_stats.limit,
          percent: Math.round(memPercent * 100) / 100,
        },
        network: { rx, tx },
      };
    } catch (err: any) {
      console.error(
        `[docker] getStats failed for ${containerId}:`,
        err.message,
      );
      return null;
    }
  }

  async listManaged(): Promise<any[]> {
    return docker.listContainers({
      all: true,
      filters: { label: ["deploykit.managed=true"] },
    });
  }

  private demuxStream(buffer: Buffer | string): string {
    if (typeof buffer === "string") return buffer;
    const lines: string[] = [];
    let offset = 0;
    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) break;
      const size = buffer.readUInt32BE(offset + 4);
      offset += 8;
      if (offset + size > buffer.length) break;
      lines.push(buffer.subarray(offset, offset + size).toString("utf-8"));
      offset += size;
    }
    return lines.join("");
  }

  async imageExistsLocally(imageName: string): Promise<boolean> {
    try {
      await docker.getImage(imageName).inspect();
      return true;
    } catch {
      return false;
    }
  }
}
