declare module "@actual-app/api" {
  export type InitConfig = {
    dataDir: string;
    serverURL: string;
    password: string;
  };

  export function init(config: InitConfig): Promise<unknown>;

  export function downloadBudget(syncId: string, options?: { password?: string }): Promise<unknown>;

  export function shutdown(): Promise<void>;

  export function getAccounts(): Promise<unknown[]>;

  export function getCategoryGroups(): Promise<unknown[]>;

  export function getPayees(): Promise<unknown[]>;

  export function getTransactions(
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<unknown[]>;
}
