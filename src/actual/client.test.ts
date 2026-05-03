import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { ActualBudgetClient } from "./client.js";
import type { AppConfig } from "../config.js";

describe("ActualBudgetClient", () => {
  test("creates the Actual data directory before initialization", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "actual-budget-mcp-"));
    const dataDir = join(tempDir, "actual-data");
    const calls: string[] = [];
      const api = {
        async init() {
          await access(dataDir);
          calls.push("init");
        },
      async downloadBudget() {
        calls.push("downloadBudget");
      },
      async shutdown() {},
      async getAccounts() {
        return [];
      },
      async getCategoryGroups() {
        return [];
      },
      async getPayees() {
        return [];
      },
      async getTransactions() {
        return [];
      },
    };

    try {
      const client = new ActualBudgetClient(createConfig(dataDir), api);
      await client.initialize();

      expect(calls).toEqual(["init", "downloadBudget"]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

function createConfig(actualDataDir: string): AppConfig {
  return {
    actualServerUrl: "http://localhost:5006",
    actualPassword: "password",
    actualBudgetId: "budget-id",
    actualDataDir,
    maxTransactions: 200,
  };
}
