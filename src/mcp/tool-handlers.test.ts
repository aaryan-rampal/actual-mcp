import { describe, expect, test } from "vitest";
import { createToolHandlers } from "./tool-handlers.js";
import type { BudgetAccount, BudgetCategory, BudgetTransaction } from "../actual/types.js";

const accounts: BudgetAccount[] = [{ id: "acct-checking", name: "Checking" }];
const categories: BudgetCategory[] = [
  { id: "cat-food", name: "Food" },
  { id: "cat-rent", name: "Rent" },
];
const transactions: BudgetTransaction[] = [
  {
    id: "tx-1",
    accountId: "acct-checking",
    amount: -2500,
    categoryId: "cat-food",
    date: "2026-03-05",
    payeeName: "Grocery Store",
  },
  {
    id: "tx-2",
    accountId: "acct-checking",
    amount: -100000,
    categoryId: "cat-rent",
    date: "2026-03-01",
    payeeName: "Landlord",
  },
];

const handlers = createToolHandlers({
  maxTransactions: 50,
  actual: {
    async getAccounts() {
      return accounts;
    },
    async getCategories() {
      return categories;
    },
    async getTransactions() {
      return transactions;
    },
  },
});

describe("createToolHandlers", () => {
  test("returns accounts from Actual", async () => {
    await expect(handlers.getAccounts()).resolves.toEqual(accounts);
  });

  test("bounds transaction results by the configured maximum", async () => {
    const result = await handlers.getTransactions({
      start: "2026-03-01",
      end: "2026-03-31",
      limit: 500,
    });

    expect(result).toHaveLength(2);
  });

  test("builds a category breakdown from Actual transactions", async () => {
    const result = await handlers.categoryBreakdown({
      start: "2026-03-01",
      end: "2026-03-31",
    });

    expect(result).toEqual([
      { categoryId: "cat-rent", categoryName: "Rent", amount: 100000, count: 1 },
      { categoryId: "cat-food", categoryName: "Food", amount: 2500, count: 1 },
    ]);
  });
});
