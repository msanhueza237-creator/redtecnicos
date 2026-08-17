import "server-only";

import { once } from "node:events";
import { createConnection } from "node:net";
import { parseClamAvResponse } from "@/domain/document-security";

const CLAMAV_CHUNK_BYTES = 64 * 1024;
const CLAMAV_TIMEOUT_MS = 25_000;
const MAX_RESPONSE_BYTES = 8 * 1024;

export interface DocumentScanResult {
  clean: boolean;
  engine: string;
  threat?: string;
}

async function writeWithBackpressure(socket: ReturnType<typeof createConnection>, chunk: Buffer): Promise<void> {
  if (!socket.write(chunk)) await once(socket, "drain");
}

async function scanWithClamAv(buffer: Buffer): Promise<DocumentScanResult> {
  const host = process.env.CLAMAV_HOST?.trim() || "redtecnicos-clamav";
  const configuredPort = Number(process.env.CLAMAV_PORT ?? "3310");
  const port = Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65535
    ? configuredPort
    : 3310;

  return new Promise<DocumentScanResult>((resolve, reject) => {
    const socket = createConnection({ host, port });
    let response = "";
    let settled = false;

    function finish(error?: Error, result?: DocumentScanResult) {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else if (result) resolve(result);
    }

    socket.setTimeout(CLAMAV_TIMEOUT_MS);
    socket.on("timeout", () => finish(new Error("CLAMAV_TIMEOUT")));
    socket.on("error", () => finish(new Error("CLAMAV_UNAVAILABLE")));
    socket.on("data", (chunk: Buffer) => {
      response += chunk.toString("utf8");
      if (response.length > MAX_RESPONSE_BYTES) return finish(new Error("CLAMAV_INVALID_RESPONSE"));
      if (!response.includes("\0")) return;

      const parsed = parseClamAvResponse(response);
      if (parsed.status === "clean") return finish(undefined, { clean: true, engine: "ClamAV" });
      if (parsed.status === "infected") {
        return finish(undefined, { clean: false, engine: "ClamAV", threat: parsed.threat });
      }
      return finish(new Error("CLAMAV_SCAN_ERROR"));
    });
    socket.on("end", () => {
      if (!settled) finish(new Error("CLAMAV_INCOMPLETE_RESPONSE"));
    });

    socket.once("connect", () => {
      void (async () => {
        await writeWithBackpressure(socket, Buffer.from("zINSTREAM\0", "ascii"));
        for (let offset = 0; offset < buffer.length; offset += CLAMAV_CHUNK_BYTES) {
          const chunk = buffer.subarray(offset, Math.min(offset + CLAMAV_CHUNK_BYTES, buffer.length));
          const length = Buffer.allocUnsafe(4);
          length.writeUInt32BE(chunk.length, 0);
          await writeWithBackpressure(socket, length);
          await writeWithBackpressure(socket, chunk);
        }
        await writeWithBackpressure(socket, Buffer.alloc(4));
      })().catch(() => finish(new Error("CLAMAV_STREAM_ERROR")));
    });
  });
}

export async function scanDocumentBuffer(buffer: Buffer): Promise<DocumentScanResult> {
  const requestedMode = process.env.DOCUMENT_SCAN_MODE?.trim().toLowerCase();
  if (requestedMode === "disabled" && process.env.NODE_ENV !== "production") {
    return { clean: true, engine: "Desactivado solo en desarrollo" };
  }
  return scanWithClamAv(buffer);
}
