#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import { ActualBudgetClient } from "./actual/client.js";
import { loadConfig } from "./config.js";
import { logError, logInfo } from "./logger.js";
import { createMcpServer } from "./mcp/server.js";

async function main(): Promise<void> {
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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logError(message);
  console.error(message);
  process.exit(1);
});
