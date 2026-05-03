import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ActualReadService } from "./tool-handlers.js";
import { createToolHandlers } from "./tool-handlers.js";

export type ServerOptions = {
  actual: ActualReadService;
  maxTransactions: number;
};

const dateRangeSchema = {
  start: z.string().describe("Inclusive start date in YYYY-MM-DD format."),
  end: z.string().describe("Inclusive end date in YYYY-MM-DD format."),
  accountId: z.string().optional().describe("Optional Actual account id."),
  categoryId: z.string().optional().describe("Optional Actual category id."),
};

export function createMcpServer(options: ServerOptions): McpServer {
  const server = new McpServer({
    name: "actual-budget-mcp",
    version: "0.1.0",
  });
  const handlers = createToolHandlers(options);
  const annotations = { readOnlyHint: true, destructiveHint: false };

  server.registerTool(
    "get_accounts",
    {
      title: "Get Accounts",
      description: "List Actual Budget accounts.",
      annotations,
    },
    async () => toToolResult(await handlers.getAccounts()),
  );

  server.registerTool(
    "get_categories",
    {
      title: "Get Categories",
      description: "List Actual Budget categories.",
      annotations,
    },
    async () => toToolResult(await handlers.getCategories()),
  );

  server.registerTool(
    "get_transactions",
    {
      title: "Get Transactions",
      description: "List transactions in a date range, optionally filtered.",
      inputSchema: {
        ...dateRangeSchema,
        limit: z.number().int().positive().optional(),
      },
      annotations,
    },
    async (input) => toToolResult(await handlers.getTransactions(input)),
  );

  server.registerTool(
    "category_breakdown",
    {
      title: "Category Breakdown",
      description: "Summarize expenses by category for a date range.",
      inputSchema: dateRangeSchema,
      annotations,
    },
    async (input) => toToolResult(await handlers.categoryBreakdown(input)),
  );

  server.registerTool(
    "monthly_spending_summary",
    {
      title: "Monthly Spending Summary",
      description: "Summarize income, expenses, net, and categories for a month.",
      inputSchema: {
        month: z.string().describe("Calendar month in YYYY-MM format."),
      },
      annotations,
    },
    async (input) => toToolResult(await handlers.monthlySpendingSummary(input)),
  );

  server.registerTool(
    "compare_months",
    {
      title: "Compare Months",
      description: "Compare income, expenses, and net totals between two months.",
      inputSchema: {
        monthA: z.string().describe("First calendar month in YYYY-MM format."),
        monthB: z.string().describe("Second calendar month in YYYY-MM format."),
      },
      annotations,
    },
    async (input) => toToolResult(await handlers.compareMonths(input)),
  );

  server.registerTool(
    "find_large_transactions",
    {
      title: "Find Large Transactions",
      description: "Find transactions whose absolute amount meets a threshold.",
      inputSchema: {
        ...dateRangeSchema,
        threshold: z.number().positive(),
        limit: z.number().int().positive().optional(),
      },
      annotations,
    },
    async (input) => toToolResult(await handlers.findLargeTransactions(input)),
  );

  return server;
}

function toToolResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
