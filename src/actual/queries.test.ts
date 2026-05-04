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
    amount: -2.5,
    categoryId: "cat-food",
    date: "2026-03-05",
    payeeName: "Grocery Store",
  },
  {
    id: "tx-2",
    accountId: "acct-checking",
    amount: -100,
    categoryId: "cat-rent",
    date: "2026-03-01",
    payeeName: "Landlord",
  },
  {
    id: "tx-3",
    accountId: "acct-savings",
    amount: -4,
    categoryId: "cat-food",
    date: "2026-04-02",
    payeeName: "Restaurant",
  },
  {
    id: "tx-4",
    accountId: "acct-checking",
    amount: 250,
    categoryId: "cat-income",
    date: "2026-03-15",
    payeeName: "Employer",
  },
  // transfer — should be excluded from summaries and breakdown
  {
    id: "tx-5",
    accountId: "acct-checking",
    amount: -50,
    categoryId: undefined,
    transferId: "tx-6",
    date: "2026-03-20",
    payeeName: "Transfer",
  },
  // split parent — has no category; children are the real expenses
  {
    id: "tx-7",
    accountId: "acct-checking",
    amount: -18,
    categoryId: undefined,
    isParent: true,
    subtransactions: [
      { id: "tx-7a", amount: -10, categoryId: "cat-food" },
      { id: "tx-7b", amount: -8, categoryId: "cat-rent" },
    ],
    date: "2026-03-22",
    payeeName: "Restaurant Split",
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

  test("categoryId 'uncategorized' excludes split parents and transfers", () => {
    const result = filterTransactions(transactions, {
      start: "2026-03-01",
      end: "2026-03-31",
      categoryId: "uncategorized",
    });

    // tx-5 is a transfer (has transferId), tx-7 is a split parent — both excluded
    expect(result).toEqual([]);
  });
});

describe("buildCategoryBreakdown", () => {
  test("groups expenses by category, ignores income, transfers, and split parents", () => {
    const result = buildCategoryBreakdown(transactions, categories);

    expect(result).toEqual([
      { categoryId: "cat-rent", categoryName: "Rent", amount: 100, count: 1 },
      { categoryId: "cat-food", categoryName: "Food", amount: 6.5, count: 2 },
    ]);
  });
});

describe("summarizeMonth", () => {
  test("summarizes income, expenses, and net for one calendar month, excluding transfers and split parents", () => {
    const result = summarizeMonth(transactions, "2026-03", categories);

    expect(result).toEqual({
      month: "2026-03",
      income: 250,
      expenses: 102.5,
      net: 147.5,
      // tx-1, tx-2, tx-4 are real; tx-5 (transfer) and tx-7 (split parent) are excluded
      transactionCount: 3,
      categoryBreakdown: [
        { categoryId: "cat-rent", categoryName: "Rent", amount: 100, count: 1 },
        { categoryId: "cat-food", categoryName: "Food", amount: 2.5, count: 1 },
      ],
    });
  });
});

describe("compareMonths", () => {
  test("returns summaries and expense deltas for two months", () => {
    const result = compareMonths(transactions, "2026-03", "2026-04", categories);

    expect(result.monthA.expenses).toBe(102.5);
    expect(result.monthB.expenses).toBe(4);
    expect(result.expenseDelta).toBe(-98.5);
    expect(result.netDelta).toBe(-151.5);
  });
});

describe("findLargeTransactions", () => {
  test("finds transactions whose absolute amount meets the threshold", () => {
    const result = findLargeTransactions(transactions, 100);

    expect(result.map((transaction) => transaction.id)).toEqual(["tx-2", "tx-4"]);
  });
});
