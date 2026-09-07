# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary duo (confirmed):**

- **ADMIN / Owner-Manager** — owns the shop, works from back-office and counter. Job: keep stock from running out, know true food cost via recipes, track daily revenue / COGS / profit, control users and settings. Situation: single Indonesian UMKM coffee shop (today one outlet, roadmap multi-store), checks dashboard daily, purchases/restocks ingredients, reviews finance, cashflow and reports.
- **CASHIER / Barista-Cashier** — front-line staff at the counter. Job: sell fast and accurately. Situation: busy service on phone/tablet, search + category filter, add to cart, collect payment (CASH/QRIS/DEBIT/TRANSFER), print/confirm transaction. Needs large tap targets, instant feedback, offline-tolerant feel.

Secondary: future multi-outlet staff (same roles per store). No invented personas beyond these two roles evidenced in `prisma/schema.prisma:11` (`Role ADMIN|CASHIER`) and `src/app/page.tsx:8` role-based redirects.

## Product Purpose

DIKOPI is a lightweight, mobile-first operations suite for an Indonesian coffee shop that replaces manual books/Excel + separate cashier app.

It does: **POS checkout → recipe-auto consumption of ingredient stock → inventory runway & restock forecast → expenses & cashflow → reports** in one Next.js web app. Why it exists: give a small shop owner true COGS/profit visibility without a heavy ERP, while letting cashiers sell in seconds on a phone.

Success means: a cashier can complete a sale in <30s on mobile; an owner can answer at a glance "what stock runs out in X days, what will restock cost, and what is true profit today/this week" without manual calculation.

## Positioning

A neighboring generic POS could not truthfully copy: **"One UMKM coffee-shop app where every product IS a recipe (BOM) — sales automatically consume ingredient stock, and the system tells you runway days, run-out date, and projected restock cost, alongside POS, expenses and cashflow."**

Not just checkout + stock counts; not just inventory. The differentiator is the **full ops loop**: product → RecipeItem → StockMovement (PURCHASE/SALE_CONSUMPTION/ADJUSTMENT/WASTE) → average-cost & runway forecast → finance. This is confirmed as the core mechanism (`prisma/schema.prisma:103-138`, `src/lib/inventory.ts`, `src/app/(app)/inventory/InventoryClient.tsx:49-137`).

## Operating Context

- **Workflows (factual):** counter checkout (search/category → cart → payment method → amount paid/change); ingredient purchase entry; adjust/waste; recipe/BOM per product linking; expense logging; user management; categories/products; dashboard/finance/cashflow/transactions/reports review; realtime refresh via Supabase Realtime with polling fallback (12s) (`src/app/(app)/dashboard/page.tsx:23`, `src/hooks/useRealtime.ts`).
- **Environment:** Indonesian language UI (`id-ID` dates, "Halo", "Keranjang", "Tambah", "Ringkasn bisnis hari ini"), **Rupiah (IDR)** throughout (`formatRupiah`), single-outlet today but designed to anticipate multi-store (`windowDays` forecast, per-store isolation is an undecided constraint).
- **Devices:** mobile-first web — `src/app/globals.css:19-66` (bottom-nav, bottom-sheet, catbar, products grid), desktop sidebar at ≥901px. POS is phone-centric; dashboard/inventory used on both.
- **Tools & data:** PostgreSQL (Supabase pooler), Prisma, NextAuth (credential), Supabase Realtime. No offline PWA fully evidenced beyond `src/components/PWA.tsx`.

## Capabilities and Constraints

**Confirmed capabilities:**
- Auth & roles (ADMIN/CASHIER, `lib/auth.ts`, `api/auth`), user CRUD (`api/users`)
- Categories & Products CRUD (`api/categories`, `api/products`)
- POS transactions with `PaymentMethod CASH|QRIS|DEBIT|TRANSFER`, `TransactionStatus COMPLETED|VOID`, amount_paid/change, COGS/gross profit calc, void, consumption (`api/transactions`, `lib/finance.ts`)
- Inventory: InventoryItem (unit g/kg/ml/liter/pcs etc), RecipeItem BOM, StockMovement types PURCHASE/SALE_CONSUMPTION/ADJUSTMENT/WASTE/RETURN/OPENING, purchase/adjustment endpoints, overview with window 7/14/30/60 days, forecast + runway, `api/inventory/*`
- Expenses & ExpenseCategories (`api/expenses`), cash adjustments, dashboard & reports (`api/dashboard`, `api/reports`)
- Finance / cashflow pages (`src/app/(app)/finance/*`, `cashflow/*`)

**Technical constraints:**
- Web only (Next.js 14.2.5, `next.config.mjs`, `middleware.ts`), mobile-first CSS variables (`--primary:#1F2933`, `--accent:#A66A3F`, `--bg:#F7F6F2`, etc. in `globals.css:5`)
- PostgreSQL + Prisma 5.22, Supabase anon key + NextAuth (`.env.example`), deployed on Vercel (`vercel.json`)
- Bottom-nav / bottom-sheet interaction patterns must be preserved for touch

**Explicitly undecided / roadmap:**
- Multi-store data isolation & per-store pricing/stock — requested as "multi-store ready" but not yet implemented (no `store_id` in schema); future work must not assume single-store forever nor invent the model
- Offline-first POS, printer integration, barcode — not evidenced
- Multi-currency / multi-language beyond id-ID/IDR — not in scope

## Brand Commitments

- **Name:** DIKOPI (confirmed in `src/app/(app)/layout.tsx:21`, `globals.css` logo). Must preserve.
- **Voice:** casual Indonesian for staff-facing copy (Halo, Tidak ada produk, Keranjang kosong, Lihat Keranjang, Lanjut ke Pembayaran). Admin finance uses Indonesian labels.
- **Incumbent visual:** warm minimal — cream `--bg:#F7F6F2`, white surfaces, terracotta accent `--accent:#A66A3F`, charcoal `--primary:#1F2933`, rounded 12-16px cards, Inter/system font. This is incumbent authority for refinement/extension; not a pinned redesign brief. No external logo/font/palette commitment was given to preserve beyond the name.
- **No invented claims:** no testimonials, press, or mascot to preserve.

## Evidence on Hand

- **Routes & UI truth:** `src/app/(app)/pos/POSClient.tsx`, `src/app/(app)/dashboard/page.tsx` + `DashboardClient.tsx`/`DashboardData.tsx`, `src/app/(app)/inventory/InventoryClient.tsx`, `src/app/(app)/finance/*`, `src/app/(app)/expenses/*`, `src/app/(app)/transactions/*`, `src/app/(app)/reports/*`, `src/app/(app)/products/*`, `src/app/(app)/categories/*`, `src/app/(app)/users/*`, `src/components/dashboard/AppNav.tsx`, `src/components/mobile/BottomNav.tsx`
- **Design tokens & layout:** `src/app/globals.css`, `tailwind.config.ts`
- **Data model:** `prisma/schema.prisma` (single source for roles, transaction, inventory)
- **Absences that must not be fabricated:** no seeded testimonials/customers/benchmarks, no public pricing page, no marketing site — do not invent.
- **Real copy & currency:** IDR via `src/lib/utils.ts:formatRupiah`

## Product Principles

1. **Speed at the counter, truth in the back.** Cashier flow stays under 30s and error-tolerant (cash change calc, payment methods); owner flow emphasizes true COGS via recipe consumption and runway, never fake efficiency that hides cost.
2. **Recipe is the source of truth.** Stock truth comes from BOM-linked consumption, not manual subtraction. Forecast and restock cost derive from it; no parallel truth.
3. **Mobile-first, thumb-ready.** Every critical action is reachable on a phone with ≥44px targets, bottom-sheet patterns, and instant client-side filtering — desktop expands, never replaces.
4. **No invention, only verified state.** Show "No forecast yet / no usage data" when data is insufficient (`InventoryClient.tsx:49-93`); never fabricate testimonials, stock, or projections.
5. **Ready for the second store.** Keep data and IA decisions reversible for multi-outlet (even while single-store today) — no hard-coded single-store assumptions in new surfaces.

## Accessibility & Inclusion

- Indonesian small-business staff including low-digital-literacy cashiers; high-contrast touch targets, large numerals for totals (`POSClient.tsx:165` 32px total), explicit empty states, polling fallback when Realtime anon key absent.
- No formal WCAG level was committed; future work should preserve ≥44px tap targets, keyboard-accessible bottom sheets, and `aria-label`/`role=progressbar` already in Inventory runway components, and test with Indonesian locale.
