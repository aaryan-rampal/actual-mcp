import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const logPath = join(process.cwd(), "logs", "actual-budget-mcp.log");

export function logInfo(message: string): void {
  writeLog("INFO", message);
}

export function logError(message: string): void {
  writeLog("ERROR", message);
}

function writeLog(level: string, message: string): void {
  const line = `${new Date().toISOString()} ${level} ${message}\n`;
  try {
    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, line, "utf8");
  } catch {
    // MCP stdout must stay protocol-only, and logging must not block startup.
  }
}
