import { describe, expect, test } from "vitest";
import {
  buildCategoryBreakdown,
  compareMonths,
  filterTransactions,
  findLargeTransactions,
  summarizeMonth,
} from "./queries.js";
import type { BudgetTransaction, CategoryLookup } from "./types.js";

const categories: CategoryLookup = new Map([
  ["cat-food", "Food"],
  ["cat-rent", "Rent"],
  ["cat-income", "Income"],
]);

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
  {
    id: "tx-3",
    accountId: "acct-savings",
    amount: -4000,
    categoryId: "cat-food",
    date: "2026-04-02",
    payeeName: "Restaurant",
  },
  {
    id: "tx-4",
    accountId: "acct-checking",
    amount: 250000,
    categoryId: "cat-income",
    date: "2026-03-15",
    payeeName: "Employer",
  },
];

describe("filterTransactions", () => {
  test("filters by date range, optional account, optional category, and limit", () => {
    const result = filterTransactions(transactions, {
      start: "2026-03-01",
      end: "2026-03-31",
      accountId: "acct-checking",
      categoryId: "cat-food",
      limit: 1,
    });

    expect(result).toEqual([transactions[0]]);
  });
});

describe("buildCategoryBreakdown", () => {
  test("groups expenses by category and ignores income", () => {
    const result = buildCategoryBreakdown(transactions, categories);

    expect(result).toEqual([
      { categoryId: "cat-rent", categoryName: "Rent", amount: 100000, count: 1 },
      { categoryId: "cat-food", categoryName: "Food", amount: 6500, count: 2 },
    ]);
  });
});

describe("summarizeMonth", () => {
  test("summarizes income, expenses, and net for one calendar month", () => {
    const result = summarizeMonth(transactions, "2026-03", categories);

    expect(result).toEqual({
      month: "2026-03",
      income: 250000,
      expenses: 102500,
      net: 147500,
      transactionCount: 3,
      categoryBreakdown: [
        { categoryId: "cat-rent", categoryName: "Rent", amount: 100000, count: 1 },
        { categoryId: "cat-food", categoryName: "Food", amount: 2500, count: 1 },
      ],
    });
  });
});

describe("compareMonths", () => {
  test("returns summaries and expense deltas for two months", () => {
    const result = compareMonths(transactions, "2026-03", "2026-04", categories);

    expect(result.monthA.expenses).toBe(102500);
    expect(result.monthB.expenses).toBe(4000);
    expect(result.expenseDelta).toBe(-98500);
    expect(result.netDelta).toBe(-151500);
  });
});

describe("findLargeTransactions", () => {
  test("finds transactions whose absolute amount meets the threshold", () => {
    const result = findLargeTransactions(transactions, 100000);

    expect(result.map((transaction) => transaction.id)).toEqual(["tx-2", "tx-4"]);
  });
});
