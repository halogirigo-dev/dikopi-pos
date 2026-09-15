# Dikopi POS — E2E Regression Baseline

This document locks the Dikopi POS E2E business simulation as the canonical
business-integrity regression baseline.

## Status: LOCKED BASELINE

- Verified: `62/62 PASS`, stable across 3 consecutive runs.
- Last verified: 2026-09-15.
- P2037 bounded-retry audit: PASS.
- Insufficient-stock contract regression: PASS.

## Canonical command

```bash
npm run sim:reset
```

This is the single command to run after any change that touches POS, inventory,
costing, P&L, payment, or transaction semantics. It:

1. Runs `prisma/seed-simulation.ts` to (re)create the deterministic fixture.
2. Drives the real HTTP API (`sim/run.ts`) end-to-end.
3. Asserts the locked financial numbers, ledger integrity, role gates, void,
   drift/NO_RECIPE, and the P2037 / insufficient-stock invariants.
4. On success, restores sim-scoped DB state back to the fixture
   (`--reset` flag = `sim:reset`).

No manual UI state is required: the simulation seeds its own fixture and drives
the API, so it is fully self-contained.

Run the non-resetting variant with `npm run sim` when you want to inspect the
post-simulation DB state.

## Locked financial values (must not change)

| Metric            | Value    |
|-------------------|----------|
| Completed revenue | 20,000   |
| Completed COGS    | 6,500    |
| Gross profit      | 13,500   |
| Total expense     | 3,325,000|
| Net P&L           | -3,311,500 |
| cashPosition      | 1,695,000|

## Invariants covered

- Ledger integrity (current_stock == Σ movements)
- No negative stock
- A/B/C costing separation
- Void (TRANSACTION_VOID / RETURN)
- Role gates (cashier blocked from writes)
- Insufficient stock -> HTTP 409 `INSUFFICIENT_STOCK`
- P2037 bounded retry -> no duplicate transactions/invoices
- Duplicate-transaction guards (one SALE_CONSUMPTION per tx × ingredient)

## Out of scope (do not add)

- Daily closing / CashAdjustment
- New payment architecture
- New costing / inventory / accounting logic
