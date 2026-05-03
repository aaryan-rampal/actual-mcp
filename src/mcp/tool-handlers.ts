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
  BudgetTransaction,
  CategoryLookup,
  TransactionFilter,
} from "../actual/types.js";

export type ActualReadService = {
  getAccounts(): Promise<BudgetAccount[]>;
  getCategories(): Promise<BudgetCategory[]>;
  getTransactions(): Promise<BudgetTransaction[]>;
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
  };
}
