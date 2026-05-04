export type BudgetAccount = {
  id: string;
  name: string;
  offbudget?: boolean | undefined;
  closed?: boolean | undefined;
};

export type BudgetCategory = {
  id: string;
  name: string;
  groupId?: string | undefined;
  groupName?: string | undefined;
};

export type SplitTransaction = {
  id: string;
  amount: number;
  categoryId?: string | null | undefined;
  notes?: string | null | undefined;
};

export type BudgetTransaction = {
  id: string;
  accountId: string;
  amount: number;
  categoryId?: string | null | undefined;
  transferId?: string | null | undefined;
  isParent?: boolean | undefined;
  subtransactions?: SplitTransaction[] | undefined;
  date: string;
  payeeName?: string | null | undefined;
  importedPayee?: string | null | undefined;
  notes?: string | null | undefined;
};

export type BudgetCategory_Item = {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  balance: number;
  carryover: boolean;
};

export type BudgetCategoryGroup = {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  balance: number;
  categories: BudgetCategory_Item[];
};

export type BudgetMonth = {
  month: string;
  toBudget: number;
  totalIncome: number;
  totalBudgeted: number;
  totalSpent: number;
  totalBalance: number;
  categoryGroups: BudgetCategoryGroup[];
};

export type CategoryLookup = Map<string, string>;

export type TransactionFilter = {
  start: string;
  end: string;
  accountId?: string | undefined;
  categoryId?: string | undefined;
  limit?: number | undefined;
};

export type CategoryBreakdownItem = {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
};

export type MonthlySummary = {
  month: string;
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
};

export type MonthComparison = {
  monthA: MonthlySummary;
  monthB: MonthlySummary;
  incomeDelta: number;
  expenseDelta: number;
  netDelta: number;
};
