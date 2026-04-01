import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { registerTerminalHandlers } from "../services/terminal";

let io: SocketServer | null = null;

const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.WEB_URL || "http://localhost:5173",
      credentials: true,
    },
    path: "/ws",
  });

  io.on("connection", (socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    // Join deployment room for real-time logs
    socket.on("subscribe:deployment", (deploymentId: string) => {
      socket.join(`deployment:${deploymentId}`);
      console.log(
        `[socket] ${socket.id} subscribed to deployment:${deploymentId}`,
      );
    });

    socket.on("unsubscribe:deployment", (deploymentId: string) => {
      socket.leave(`deployment:${deploymentId}`);
    });

    // Join container room for live logs
    socket.on("subscribe:logs", (containerId: string) => {
      socket.join(`logs:${containerId}`);
    });

    socket.on("unsubscribe:logs", (containerId: string) => {
      socket.leave(`logs:${containerId}`);
    });

    // Join service room for live metrics
    socket.on("subscribe:metrics", (serviceId: string) => {
      socket.join(`metrics:${serviceId}`);
    });

    socket.on("unsubscribe:metrics", (serviceId: string) => {
      socket.leave(`metrics:${serviceId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[socket] Client disconnected: ${socket.id}`);
    });

    // Terminal (web shell)
    registerTerminalHandlers(socket);
  });

  return io;
};

const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};

const emitDeployLog = (deploymentId: string, log: string) => {
  io?.to(`deployment:${deploymentId}`).emit("deploy:log", {
    deploymentId,
    log,
  });
};

const emitDeployStatus = (
  deploymentId: string,
  status: string,
  data?: Record<string, any>,
) => {
  io?.to(`deployment:${deploymentId}`).emit("deploy:status", {
    deploymentId,
    status,
    ...data,
  });
  // Also broadcast to all clients for dashboard updates
  io?.emit("service:updated", { deploymentId, status, ...data });
};

const emitContainerLog = (containerId: string, log: string) => {
  io?.to(`logs:${containerId}`).emit("container:log", { containerId, log });
};

const emitServiceStatus = (serviceId: string, status: string) => {
  io?.emit("service:updated", { serviceId, status });
};

export {
  initSocket,
  getIO,
  emitDeployLog,
  emitDeployStatus,
  emitContainerLog,
  emitServiceStatus,
};
