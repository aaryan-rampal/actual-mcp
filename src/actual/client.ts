import { mkdir } from "node:fs/promises";
import * as actualApi from "@actual-app/api";
import type { BudgetAccount, BudgetCategory, BudgetTransaction } from "./types.js";
import type { AppConfig } from "../config.js";

type ActualApi = typeof actualApi;
type RawRecord = Record<string, unknown>;

export class ActualBudgetClient {
  private readonly api: ActualApi;

  private readonly config: AppConfig;

  public constructor(config: AppConfig, api: ActualApi = actualApi) {
    this.config = config;
    this.api = api;
  }

  public async initialize(): Promise<void> {
    await mkdir(this.config.actualDataDir, { recursive: true });

    await this.api.init({
      dataDir: this.config.actualDataDir,
      serverURL: this.config.actualServerUrl,
      password: this.config.actualPassword,
    });

    try {
      if (this.config.actualE2ePassword) {
        await this.api.downloadBudget(this.config.actualBudgetId, {
          password: this.config.actualE2ePassword,
        });
        return;
      }

      await this.api.downloadBudget(this.config.actualBudgetId);
    } catch (error) {
      await this.api.shutdown();
      throw new Error(
        `Failed to download Actual budget "${this.config.actualBudgetId}". ` +
          `Check ACTUAL_SERVER_URL, ACTUAL_PASSWORD, ACTUAL_BUDGET_ID, ` +
          `and ACTUAL_E2E_PASSWORD if your budget is encrypted. Cause: ${formatCause(error)}`,
      );
    }
  }

  public async shutdown(): Promise<void> {
    await this.api.shutdown();
  }

  public async getAccounts(): Promise<BudgetAccount[]> {
    const rawAccounts = (await this.api.getAccounts()) as RawRecord[];
    return rawAccounts.map(mapAccount);
  }

  public async getCategories(): Promise<BudgetCategory[]> {
    const groups = (await this.api.getCategoryGroups()) as RawRecord[];
    return groups.flatMap(mapCategoryGroup);
  }

  public async getTransactions(): Promise<BudgetTransaction[]> {
    const accounts = await this.getAccounts();
    const payees = await this.getPayeeLookup();
    const transactions: BudgetTransaction[] = [];

    for (const account of accounts) {
      const rawTransactions = (await this.api.getTransactions(
        account.id,
        "1900-01-01",
        "2100-12-31",
      )) as RawRecord[];

      transactions.push(...rawTransactions.map((raw) => mapTransaction(raw, account.id, payees)));
    }

    return transactions;
  }

  private async getPayeeLookup(): Promise<Map<string, string>> {
    const rawPayees = (await this.api.getPayees()) as RawRecord[];
    return new Map(rawPayees.map((payee) => [toString(payee["id"]), toString(payee["name"])]));
  }
}

function mapAccount(raw: RawRecord): BudgetAccount {
  return {
    id: toString(raw["id"]),
    name: toString(raw["name"]),
    offbudget: toBoolean(raw["offbudget"]),
    closed: toBoolean(raw["closed"]),
  };
}

function mapCategoryGroup(raw: RawRecord): BudgetCategory[] {
  const groupId = toString(raw["id"]);
  const groupName = toString(raw["name"]);
  const categories = Array.isArray(raw["categories"]) ? raw["categories"] : [];

  return categories.map((category) => {
    const record = category as RawRecord;
    return {
      id: toString(record["id"]),
      name: toString(record["name"]),
      groupId,
      groupName,
    };
  });
}

function mapTransaction(
  raw: RawRecord,
  accountId: string,
  payees: Map<string, string>,
): BudgetTransaction {
  const payeeId = toOptionalString(raw["payee"]);

  return {
    id: toString(raw["id"]),
    accountId: toOptionalString(raw["account"]) ?? accountId,
    amount: toNumber(raw["amount"]),
    categoryId: toOptionalString(raw["category"]),
    date: toString(raw["date"]),
    payeeName: payeeId ? (payees.get(payeeId) ?? payeeId) : undefined,
    importedPayee: toOptionalString(raw["imported_payee"]),
    notes: toOptionalString(raw["notes"]),
  };
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function toOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return toString(value);
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function formatCause(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
