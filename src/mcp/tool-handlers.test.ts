import { describe, expect, test } from "vitest";
import { createToolHandlers } from "./tool-handlers.js";
import type { BudgetAccount, BudgetCategory, BudgetMonth, BudgetTransaction } from "../actual/types.js";

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

const march: BudgetMonth = {
  month: "2026-03",
  toBudget: 5000,
  totalIncome: 300000,
  totalBudgeted: 295000,
  totalSpent: -102500,
  totalBalance: 192500,
  categoryGroups: [
    {
      id: "grp-expenses",
      name: "Expenses",
      budgeted: 102500,
      spent: -102500,
      balance: 0,
      categories: [
        { id: "cat-food", name: "Food", budgeted: 5000, spent: -2500, balance: 2500, carryover: false },
        { id: "cat-rent", name: "Rent", budgeted: 100000, spent: -100000, balance: 0, carryover: false },
      ],
    },
  ],
};

const april: BudgetMonth = {
  month: "2026-04",
  toBudget: 1000,
  totalIncome: 300000,
  totalBudgeted: 299000,
  totalSpent: -4000,
  totalBalance: 295000,
  categoryGroups: [],
};

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
    async getBudgetMonth(month: string) {
      if (month === "2026-03") return march;
      if (month === "2026-04") return april;
      throw new Error(`unexpected month: ${month}`);
    },
  },
});

describe("createToolHandlers", () => {
  test("returns accounts from Actual", async () => {
    await expect(handlers.getAccounts()).resolves.toEqual(accounts);
  });

  test("returns budget months for a contiguous range", async () => {
    const result = await handlers.getBudgetMonths({ start: "2026-03", end: "2026-04" });

    expect(result).toEqual([march, april]);
  });

  test("returns a single month when start equals end", async () => {
    const result = await handlers.getBudgetMonths({ start: "2026-03", end: "2026-03" });

    expect(result).toEqual([march]);
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
