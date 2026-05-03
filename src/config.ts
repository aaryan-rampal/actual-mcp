export type AppConfig = {
  actualServerUrl: string;
  actualPassword: string;
  actualBudgetId: string;
  actualE2ePassword?: string | undefined;
  actualDataDir: string;
  maxTransactions: number;
};

type Env = Record<string, string | undefined>;

const DEFAULT_DATA_DIR = ".actual-data";
const DEFAULT_MAX_TRANSACTIONS = 200;

export function loadConfig(env: Env = process.env): AppConfig {
  const missing = [
    ["ACTUAL_SERVER_URL", env["ACTUAL_SERVER_URL"]],
    ["ACTUAL_PASSWORD", env["ACTUAL_PASSWORD"]],
    ["ACTUAL_BUDGET_ID", env["ACTUAL_BUDGET_ID"]],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(", ")}`);
  }

  return {
    actualServerUrl: env["ACTUAL_SERVER_URL"] ?? "",
    actualPassword: env["ACTUAL_PASSWORD"] ?? "",
    actualBudgetId: env["ACTUAL_BUDGET_ID"] ?? "",
    actualE2ePassword: env["ACTUAL_E2E_PASSWORD"],
    actualDataDir: env["ACTUAL_DATA_DIR"] ?? DEFAULT_DATA_DIR,
    maxTransactions: parsePositiveInteger(
      env["ACTUAL_MAX_TRANSACTIONS"],
      DEFAULT_MAX_TRANSACTIONS,
      "ACTUAL_MAX_TRANSACTIONS",
    ),
  };
}

function parsePositiveInteger(raw: string | undefined, fallback: number, name: string): number {
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}
