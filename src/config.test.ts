import { describe, expect, test } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  test("fails fast when required Actual settings are missing", () => {
    expect(() => loadConfig({})).toThrow(
      "Missing ACTUAL_SERVER_URL, ACTUAL_PASSWORD, ACTUAL_BUDGET_ID",
    );
  });

  test("loads required settings and defaults optional settings", () => {
    const result = loadConfig({
      ACTUAL_SERVER_URL: "http://localhost:5006",
      ACTUAL_PASSWORD: "password",
      ACTUAL_BUDGET_ID: "budget-id",
    });

    expect(result).toEqual({
      actualServerUrl: "http://localhost:5006",
      actualPassword: "password",
      actualBudgetId: "budget-id",
      actualE2ePassword: undefined,
      actualDataDir: ".actual-data",
      maxTransactions: 200,
    });
  });
});
