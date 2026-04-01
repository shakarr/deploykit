import { docker } from "../lib/docker";
import { emitContainerLog } from "../lib/socket";

// Track active log streams so we can clean them up
const activeStreams = new Map<string, NodeJS.ReadableStream>();

// Start streaming logs from a container to Socket.IO room.
const startLogStream = async (containerId: string): Promise<void> => {
  // Don't create duplicate streams
  if (activeStreams.has(containerId)) return;

  try {
    const container = docker.getContainer(containerId);
    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true,
      tail: 50,
      since: Math.floor(Date.now() / 1000) - 60, // last 60 seconds
    });

    activeStreams.set(containerId, stream);

    stream.on("data", (chunk: Buffer) => {
      // Docker multiplexed stream: first 8 bytes are header
      const lines = demuxChunk(chunk);
      for (const line of lines) {
        if (line.trim()) {
          emitContainerLog(containerId, line);
        }
      }
    });

    stream.on("end", () => {
      activeStreams.delete(containerId);
    });

    stream.on("error", () => {
      activeStreams.delete(containerId);
    });
  } catch (err) {
    console.error(`[logs] Failed to start stream for ${containerId}:`, err);
  }
};

// Stop streaming logs for a container.
const stopLogStream = (containerId: string): void => {
  const stream = activeStreams.get(containerId);
  if (stream) {
    (stream as any).destroy?.();
    activeStreams.delete(containerId);
  }
};

// Demux Docker multiplexed stream chunk into text lines.
const demuxChunk = (chunk: Buffer): string[] => {
  const lines: string[] = [];
  let offset = 0;

  while (offset < chunk.length) {
    if (offset + 8 > chunk.length) {
      // Incomplete header, treat rest as raw text
      lines.push(chunk.subarray(offset).toString("utf-8"));
      break;
    }

    const size = chunk.readUInt32BE(offset + 4);
    offset += 8;

    if (size === 0) continue;

    if (offset + size > chunk.length) {
      lines.push(chunk.subarray(offset).toString("utf-8"));
      break;
    }

    lines.push(chunk.subarray(offset, offset + size).toString("utf-8"));
    offset += size;
  }

  return lines;
};

export { startLogStream, stopLogStream };
