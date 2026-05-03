# Actual Budget MCP

Read-only stdio MCP server for asking structured questions against an Actual
Budget file.

This project is local-first. It exposes budget data to the MCP client you
connect it to, and that client may send tool results to a hosted model. Start
with read-only access and review your client/model privacy settings.

## Configuration

Required environment variables:

```sh
ACTUAL_SERVER_URL=http://localhost:5006
ACTUAL_PASSWORD=your_actual_password
ACTUAL_BUDGET_ID=your_budget_sync_id
```

For local use, put these values in `.env` or export them in the shell that
starts your MCP client. `.env` is gitignored.

Optional:

```sh
ACTUAL_E2E_PASSWORD=your_e2e_password
ACTUAL_DATA_DIR=.actual-data
ACTUAL_MAX_TRANSACTIONS=200
```

## Development

```sh
pnpm install
pnpm run build
pnpm test
pnpm run typecheck
pnpm run lint
```
