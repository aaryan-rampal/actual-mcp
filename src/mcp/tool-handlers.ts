import {
  buildCategoryBreakdown,
  compareMonths,
  filterTransactions,
  findLargeTransactions,
  summarizeMonth,
} from "../actual/queries.js";
import type {
  BudgetAccount,
  BudgetCategory,
  BudgetMonth,
  BudgetTransaction,
  CategoryLookup,
  TransactionFilter,
} from "../actual/types.js";

export type ActualReadService = {
  getAccounts(): Promise<BudgetAccount[]>;
  getCategories(): Promise<BudgetCategory[]>;
  getTransactions(): Promise<BudgetTransaction[]>;
  getBudgetMonth(month: string): Promise<BudgetMonth>;
};

export type ToolHandlerOptions = {
  actual: ActualReadService;
  maxTransactions: number;
};

export type GetTransactionsInput = TransactionFilter;

export type DateRangeInput = {
  start: string;
  end: string;
  accountId?: string | undefined;
  categoryId?: string | undefined;
};

export type MonthInput = {
  month: string;
};

export type CompareMonthsInput = {
  monthA: string;
  monthB: string;
};

export type MonthRangeInput = {
  start: string;
  end: string;
};

export type LargeTransactionsInput = DateRangeInput & {
  threshold: number;
  limit?: number | undefined;
};

export function createToolHandlers(options: ToolHandlerOptions) {
  async function getCategoryLookup(): Promise<CategoryLookup> {
    const categories = await options.actual.getCategories();
    return new Map(categories.map((category) => [category.id, category.name]));
  }

  async function getFilteredTransactions(input: GetTransactionsInput) {
    const transactions = await options.actual.getTransactions();
    return filterTransactions(transactions, {
      ...input,
      limit: Math.min(input.limit ?? options.maxTransactions, options.maxTransactions),
    });
  }

  return {
    getAccounts: () => options.actual.getAccounts(),
    getCategories: () => options.actual.getCategories(),
    getTransactions: getFilteredTransactions,
    async categoryBreakdown(input: DateRangeInput) {
      const categories = await getCategoryLookup();
      const transactions = await getFilteredTransactions(input);
      return buildCategoryBreakdown(transactions, categories);
    },
    async monthlySpendingSummary(input: MonthInput) {
      const categories = await getCategoryLookup();
      const transactions = await options.actual.getTransactions();
      return summarizeMonth(transactions, input.month, categories);
    },
    async compareMonths(input: CompareMonthsInput) {
      const categories = await getCategoryLookup();
      const transactions = await options.actual.getTransactions();
      return compareMonths(transactions, input.monthA, input.monthB, categories);
    },
    async findLargeTransactions(input: LargeTransactionsInput) {
      const transactions = await getFilteredTransactions(input);
      return findLargeTransactions(transactions, input.threshold).slice(
        0,
        Math.min(input.limit ?? options.maxTransactions, options.maxTransactions),
      );
    },
    async getBudgetMonths(input: MonthRangeInput) {
      const months = monthRange(input.start, input.end);
      return Promise.all(months.map((month) => options.actual.getBudgetMonth(month)));
    },
  };
}

function monthRange(start: string, end: string): string[] {
  const months: string[] = [];
  let [year, month] = start.split("-").map(Number) as [number, number];
  const [endYear, endMonth] = end.split("-").map(Number) as [number, number];

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}
