#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import { ActualBudgetClient } from "./actual/client.js";
import { loadConfig } from "./config.js";
import { logError, logInfo } from "./logger.js";
import { createMcpServer } from "./mcp/server.js";

async function main(): Promise<void> {
  hideProtocolNoiseFromStdout();
  const config = loadConfig();
  logInfo(`Starting Actual Budget MCP for ${config.actualServerUrl}`);
  const actual = new ActualBudgetClient(config);
  await actual.initialize();
  logInfo("Actual Budget API initialized");

  const server = createMcpServer({
    actual,
    maxTransactions: config.maxTransactions,
  });
  const transport = new StdioServerTransport();

  process.on("SIGINT", () => {
    void shutdown(server, actual);
  });
  process.on("SIGTERM", () => {
    void shutdown(server, actual);
  });

  await server.connect(transport);
  logInfo("MCP stdio transport connected");
}

async function shutdown(
  server: Awaited<ReturnType<typeof createMcpServer>>,
  actual: ActualBudgetClient,
): Promise<void> {
  await server.close();
  await actual.shutdown();
  process.exit(0);
}

function hideProtocolNoiseFromStdout(): () => void {
  const write = process.stdout.write;

  process.stdout.write = (
    chunk: string | Uint8Array<ArrayBufferLike>,
    encodingOrCallback?: BufferEncoding | null | ((error?: Error | null | undefined) => void),
    callback?: (error?: Error | null | undefined) => void,
  ): boolean => {
    const message = typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);

    if (message.includes("[Breadcrumb]")) {
      process.stderr.write(message);
      return true;
    }

    const actualCallback =
      typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    const actualEncoding =
      typeof encodingOrCallback === "string"
        ? encodingOrCallback
        : undefined;

    return write.call(process.stdout, chunk, actualEncoding, actualCallback);
  };

  return () => {
    process.stdout.write = write;
  };
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logError(message);
  console.error(message);
  process.exit(1);
});
