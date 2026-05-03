import type {
  BudgetTransaction,
  CategoryBreakdownItem,
  CategoryLookup,
  MonthComparison,
  MonthlySummary,
  TransactionFilter,
} from "./types.js";

const UNCATEGORIZED_ID = "uncategorized";
const UNCATEGORIZED_NAME = "Uncategorized";

function isTransfer(transaction: BudgetTransaction): boolean {
  return transaction.transferId != null;
}

export function filterTransactions(
  transactions: BudgetTransaction[],
  filter: TransactionFilter,
): BudgetTransaction[] {
  const filtered = transactions.filter((transaction) => {
    const inDateRange = transaction.date >= filter.start && transaction.date <= filter.end;
    const inAccount = !filter.accountId || transaction.accountId === filter.accountId;
    const inCategory = !filter.categoryId || transaction.categoryId === filter.categoryId;

    return inDateRange && inAccount && inCategory;
  });

  return filtered.slice(0, filter.limit);
}

export function buildCategoryBreakdown(
  transactions: BudgetTransaction[],
  categories: CategoryLookup,
): CategoryBreakdownItem[] {
  const totals = new Map<string, CategoryBreakdownItem>();

  for (const transaction of transactions) {
    if (transaction.amount >= 0 || isTransfer(transaction)) {
      continue;
    }

    const categoryId = transaction.categoryId ?? UNCATEGORIZED_ID;
    const existing = totals.get(categoryId);
    const amount = Math.abs(transaction.amount);

    if (existing) {
      existing.amount += amount;
      existing.count += 1;
      continue;
    }

    totals.set(categoryId, {
      categoryId,
      categoryName: categories.get(categoryId) ?? UNCATEGORIZED_NAME,
      amount,
      count: 1,
    });
  }

  return [...totals.values()].sort((left, right) => right.amount - left.amount);
}

export function summarizeMonth(
  transactions: BudgetTransaction[],
  month: string,
  categories: CategoryLookup,
): MonthlySummary {
  const monthTransactions = filterTransactions(transactions, {
    start: `${month}-01`,
    end: `${month}-31`,
  });

  const income = monthTransactions
    .filter((transaction) => transaction.amount > 0 && !isTransfer(transaction))
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = monthTransactions
    .filter((transaction) => transaction.amount < 0 && !isTransfer(transaction))
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);

  return {
    month,
    income,
    expenses,
    net: income - expenses,
    transactionCount: monthTransactions.length,
    categoryBreakdown: buildCategoryBreakdown(monthTransactions, categories),
  };
}

export function compareMonths(
  transactions: BudgetTransaction[],
  monthA: string,
  monthB: string,
  categories: CategoryLookup,
): MonthComparison {
  const summaryA = summarizeMonth(transactions, monthA, categories);
  const summaryB = summarizeMonth(transactions, monthB, categories);

  return {
    monthA: summaryA,
    monthB: summaryB,
    incomeDelta: summaryB.income - summaryA.income,
    expenseDelta: summaryB.expenses - summaryA.expenses,
    netDelta: summaryB.net - summaryA.net,
  };
}

export function findLargeTransactions(
  transactions: BudgetTransaction[],
  threshold: number,
): BudgetTransaction[] {
  return transactions.filter((transaction) => Math.abs(transaction.amount) >= threshold);
}
