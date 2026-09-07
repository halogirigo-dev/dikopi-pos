---
name: DIKOPI
description: Warm minimal POS & inventory ops suite — precise, scannable, thumb-ready for Indonesian UMKM coffee shop
colors:
  charcoal: "#1F2933"
  charcoal-hover: "#111827"
  cream: "#F7F6F2"
  surface: "#FFFFFF"
  surface-2: "#F2F1ED"
  border: "#E5E3DE"
  ink: "#171717"
  ink-soft: "#6B6B6B"
  muted: "#9A9A9A"
  terracotta: "#A66A3F"
  terracotta-soft: "#F4E9E0"
  green: "#16803C"
  green-soft: "#EAF6ED"
  red: "#D92D20"
  red-soft: "#FDECEC"
  warning: "#B7791F"
  warning-soft: "#FFF7E5"
  info: "#2563EB"
  info-soft: "#EFF6FF"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.33
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.07em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  button-primary-hover:
    backgroundColor: "{colors.charcoal-hover}"
  button-accent:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  card-compact:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "14px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  badge:
    backgroundColor: "{colors.green-soft}"
    textColor: "{colors.green}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-cat:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  segment:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.pill}"
    padding: "3px"
---

# Design System: DIKOPI

## Overview

**Creative North Star: "The Warm Counter"**

DIKOPI lives at the warm counter where light falls on cream paper, charcoal ink, and a single terracotta accent. It is a hospitality-ops system, not a marketing site: the aesthetic is warm minimal, precise, and scannable, built for a small Indonesian coffee shop to sell fast and know true cost. Every surface is mobile-first and thumb-ready, then expands to desktop — never the reverse. The world rejects neon, gradients, glass, and brochure hype; its richness comes from tonal layering, confident type hierarchy, and careful stock-runway storytelling.

Surfaces share a calm ground (cream), white containers, and thin warm-gray borders. Accent appears sparingly to signal action or attention, never as decoration. Info lives in dense-but-legible stacks with generous separation, so a manager can answer “how much, is it safe, how long, when to restock, at what cost” within 3 seconds on a phone.

**Key Characteristics:**
- Warm minimal hospitality — cream ground, charcoal ink, terracotta accent, white surfaces
- Mobile-first, thumb-ready — bottom nav + bottom sheets on phone, 236px sidebar only ≥901px
- Precise & scannable — 28px hero stock, 12/700 runway, single integrated restock row
- Tonal depth, not shadow depth — flat at rest, 0 1px 3px only on cards
- Confident & tactile components — 12-16px radius, 40-48px touch targets, solid fills, no glass

## Colors

The palette is restrained (charcoal + terracotta + cream + neutral) with semantic soft pairs for status. Every surface uses cream ground with white containers; accent rarity is the point.

### Primary
- **Charcoal** (#1F2933): Primary action, nav active text on terracotta-soft, price and hero numerals. Used for `.btn.primary` background, `.nav button.active` text, and 28px stock hero (`--primary`).

### Secondary
- **Terracotta** (#A66A3F): Single warm accent for attention and restock. Used for `.btn.accent`, `.cat.active`, `.nav button.active` background (`--accent`), and status dot emphasis. Its soft pair is Terracotta Soft.

### Neutral
- **Cream** (#F7F6F2): Page ground (`--bg`). Never used as card fill; lets white surfaces breathe.
- **Surface White** (#FFFFFF): Card, input, button, sheet fills (`--surface`). Always with 1px border.
- **Surface Warm Gray** (#F2F1ED): Secondary surface for integrated rows, segment track, cash input (`--surface2`).
- **Border Warm Gray** (#E5E3DE): Hairline borders on cards/inputs/chips (`--border`).
- **Ink** (#171717): Body text (`--text`), 800-weight heroes.
- **Ink Soft** (#6B6B6B): Secondary text, runway subline (`--text2`) — meets 4.5:1 on white.
- **Muted** (#9A9A9A): Tertiary 10px labels only (`--muted`).
- **Terracotta Soft** (#F4E9E0): Accent tint for focus ring and nav active bg (`--accent-soft`).
- **Green** (#16803C) / **Green Soft** (#EAF6ED): Safe/positive — badge, stock bar SAFE (`--green`/`--green-soft`).
- **Red** (#D92D20) / **Red Soft** (#FDECEC): Critical/OUT/void — status, badge.red (`--red`/`--red-soft`).
- **Warning** (#B7791F) / **Warning Soft** (#FFF7E5): Low stock — bar and badge warn.
- **Info** (#2563EB) / **Info Soft** (#EFF6FF): Informational only — not used on inventory card.
- **Charcoal Hover** (#111827): Hover state of primary (`--primary-hover`).

### Named Rules
**The One Warm Accent Rule.** Terracotta appears on ≤10% of any screen — one primary action or one status pill per card. If two terracotta buttons compete, one must become ghost.

**The Ground Rule.** Cream is ground only; containers are always white with 1px border. Never place cream on cream.

## Typography

**Display Font:** Inter (with ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif fallback) via `next/font/google` in `src/app/layout.tsx:2` (`Inter({ subsets: ["latin"] })`)
**Body Font:** Inter — same stack
**Label Font:** Inter — same stack, letterspaced

**Character:** Inter as a workhorse sans — neutral, precise, high legibility at small sizes and dense numbers. Weight does the hierarchy (400 body, 600-700 sections, 800 heroes), not family contrast. Tabular numerals for stock and money.

### Hierarchy
- **Display** (800, 28px, line-height 1, -0.03em): Hero stock qty on inventory card (`src/app/(app)/inventory/InventoryClient.tsx:394` 28/800) and POS total (`src/app/(app)/pos/POSClient.tsx:165` 32px variant). Max 1 per viewport.
- **Headline** (800, 24px, 1.1, -0.03em): Page greeting "Halo, ..." (`src/app/(app)/dashboard/page.tsx:27`) and empty-state titles.
- **Title** (700, 18px, 1.33): Card titles, sheet heads, section titles.
- **Body** (400, 14px, 1.43, max ~65ch): Default UI text, card body, list rows (`body{font-size:14px;line-height:20px}` in `src/app/globals.css:14`).
- **Label** (700, 11px, 1.2, 0.07em, uppercase): Section eyebrows like `STOCK NEEDING ATTENTION`, `BIAYA RESTOCK`, `TARGET` — always in `var(--ink-soft)` or `var(--muted)` for 10-11px.

### Named Rules
**The Weight-Does-Work Rule.** Hierarchy comes from 400→600→700→800 steps, not size alone. A new weight must earn a distinct role.

**The Tabular Numerals Rule.** Stock (`bar_pct`, `current_stock`), money (`formatRupiah`), and dates use `font-variant-numeric: tabular-nums` via `.kpi-value` + `.table td.num` — prevents layout shift on updates.

## Layout

Mobile-first flex + constrained content. Sidebar is progressive enhancement, not base layout.

- **App shell:** `.app{display:flex;min-height:100vh}`; `.main{flex:1;min-width:0;padding-bottom:72px}` and `margin-left:236px` only ≥901px (`src/app/globals.css:19-23`). Sidebar `.sidebar{width:236px;position:fixed;display:none}` and `display:block` ≥901px (`:28-29`). Topbar `height 56 → 68` at ≥901px, `position:sticky` (`:40-41`).
- **Content:** `.content{padding:16px;max-width:1440px;margin:0 auto}` → `24px` ≥768px → `30px 34px` ≥1024px (`:23-25`).
- **Inventory card grid:** `display:grid;gap:12` for card stacks; card `padding14 gap10` internal; runway+restock `display:grid;gridTemplateColumns:1fr auto;alignItems:center;gap12` (one row that answers how-long + cost).
- **Dashboard kpi grid:** `.grid-kpi{grid:1fr → repeat(2,1fr)@390px → repeat(3,1fr)@901px;gap12}` (`:69-71`).
- **POS products:** `.products{repeat(2,1fr) gap10}` → `repeat(3,1fr)@768px` (`:79-81`).
- **Forms:** `.formgrid{1fr gap12}` → `1fr 1fr@640px` (`:102-103`).
- **Spacing rhythm:** xs4 / sm8 / md12 / lg16 / xl24 / 2xl32. Tight groups (card internal gap10), generous separation (section gap12-16, more space above heading than below). Cards breathe; density lives inside the integrated surface2 row, not in card outer padding.
- **Responsive:** Bottom nav `.bottom-nav{position:fixed;bottom:0}` and `display:none@901px`; catbar `.catbar{display:flex;gap8;overflow:auto}`; bottom-sheet `border-radius:24px 24px 0 0;max-height:85vh` (`:111-113`).

## Elevation & Depth

Flat + tonal layering is the depth system. Shadows are ambient, not structural, and appear sparingly on resting cards and active segment pills. Most depth comes from ground (cream) → surface (white) → surface2 (warm gray) plus 1px border.

**The Flat-By-Default Rule.** Surfaces are flat at rest; tonal steps do 90% of the work. Shadow is a confirmation, not a construction.

### Shadow Vocabulary
- **Card ambient** (`box-shadow: 0 1px 3px rgba(0,0,0,.06)`): Default on `.card`, `.segment button.active` (`--shadow` in `src/app/globals.css:10`). Use on `.card`, sheets, and active pills only. Never on inputs or cat pills at rest.
- **Topbar blur** (`backdrop-filter: blur(8px)` + `background: rgba(255,255,255,.95)`): Sticky topbar glass (`src/app/globals.css:40`) — the single allowed blur, for nav separation only.

## Shapes

Soft, confident, tactile — never sharp, never ultra-soft.

- **Radius sm** (8px): Sidebar nav buttons (`border-radius:8px` in `src/app/globals.css:33`).
- **Radius md** (12px): Buttons (`.btn border-radius12`), inputs (`.input 12`), pay tiles (`.pay 12`), progress track (bar 999 but container 12 for surface2 row).
- **Radius lg** (16px): Cards (`.card 16`, `.product 16`, `.bottom-nav .pos-cta 16`).
- **Radius xl** (24px): Bottom sheets (`.bottom-sheet-card 24 24 0 0`).
- **Radius pill** (999px): Chips/cat (`.cat 999`), badges (`.badge 999`), segment (`.segment 999`), segment knobs, status pills. Pill is reserved for filters/tags/status — never for cards or inputs.
- **Borders:** `1px solid var(--border)` on every card/input/chip/pay/qty button. No colored left borders (>1px) — forbidden.
- **Handle:** `.sheet-handle{width36 height4 bg:var(--border) radius999}`.

## Components

All components are solid fills, 1px border, no glass gradients. Hover is a tonal shift, not a glow.

### Buttons
- **Shape:** 12px radius, `padding 10px 14px`, `min-height 44px` (touch target), `font-weight 600 14px`, `gap6`, `inline-flex center`.
- **Primary:** `background var(--primary) #1F2933`, `color #fff`, `border var(--primary)`; hover `var(--primary-hover) #111827` (`.btn.primary` in `src/app/globals.css:51`).
- **Accent:** `background var(--accent) #A66A3F`, `color #fff`, `border var(--accent)` (`.btn.accent`). Use for one restock/purchase CTA per card.
- **Ghost/Secondary:** `background var(--surface) #fff`, `border var(--border)`, `color var(--text)`, hover `var(--surface2)` (`.btn`).
- **Focus:** Input focus is the system focus pattern — `border-color var(--accent)` + `box-shadow 0 0 0 3px var(--accent-soft)` — apply same to button focus-visible.
- **Compact variant (inventory card):** `min-height 40`, `padding 8px 10px`, `radius10` — still ≥40px tap, for dense rows.

### Cards / Containers
- **Corner:** 16px, `background var(--surface)`, `border 1px solid var(--border)`, `shadow 0 1px 3px`.
- **Compact card:** `padding14 gap10` (inventory stock card); default `padding16` with optional `.card-head{padding16 border-bottom 1px}`.
- **Integrated row:** `background var(--surface2)`, `radius12`, `padding 10px 12px` — houses runway + cost in one tonal step.
- **Product card:** `overflow:hidden`, `border 1px solid var(--border)`, `radius16`, `prod-info{padding14 flex column gap2}`.

### Inputs / Fields
- **Style:** `border 1px solid var(--border)`, `background var(--surface)`, `radius12`, `padding 12px 14px`, `min-height 48`, `font-size 14`.
- **Focus:** `border-color var(--accent)` + `box-shadow 0 0 0 3px var(--accent-soft)` (`src/app/globals.css:55`).
- **Field label:** `11px 650 var(--text2)` (`src/app/globals.css:105` .field label).
- **Error/disabled:** `opacity .5 pointer-events:none` on disabled btn/input.

### Chips (Category Filter)
- **Style:** `.cat{white-space:nowrap;border1px var(--border);bg var(--surface);radius999;padding 8px 14px;font-size13 weight500 min-height36}`; active `bg var(--primary) color #fff border var(--primary)` (`src/app/globals.css:83-84`).

### Segment
- **Style:** `.segment{display:flex;background var(--surface2);radius999;padding3;gap3}`; knob `flex1 border0 bg transparent padding 8 12 radius999 font13 weight600 color var(--muted)`; active `bg var(--surface) color var(--text) shadow var(--shadow)` (`:114-116`).

### Badge
- **Style:** `.badge{padding4 10 radius999 font11 weight700 bg var(--green-soft) color var(--green)}`; variants `.red` / `.warn` map to red-soft/warning-soft (`src/app/globals.css:56`).

### Stock Bar
- **Track:** `height6 background #E5E3DE radius999`; fill `background m.bar` per status (SAFE #22C55E, LOW #F59E0B, CRITICAL #EF4444, OUT #DC2626), `transition width .4s ease`, `role=progressbar`.

### Navigation
- **Desktop sidebar:** `width236 bg var(--surface) border-right1px var(--border) padding22 14 fixed` (`:28`), logo `22/800 -.04em` with `span{color var(--accent)}`, section `10/700 .12em #aaa`, nav item `10 12 radius8 color #666 gap11 font13`, hover `bg var(--surface2) color var(--text)`, active `bg var(--accent-soft) color var(--accent) weight650`.
- **Mobile bottom-nav:** `fixed bottom0 bg var(--surface) border-top1px flex space-around padding6 + safe-area z40`; item `flex1 column gap3 padding6 4 color var(--muted) font10 weight600 min-height44`; active `color var(--accent)`; POS CTA `bg var(--primary) color #fff radius16 padding8 14 min-height36` (`:60-66`), hide ≥901px.
- **Topbar:** `height56→68 bg rgba(255,255,255,.95) backdrop blur8 border-bottom1px sticky top0 z10` (`:40-41`).

### Bottom Sheet
- **Style:** `.bottom-sheet{fixed inset0 bg rgba(0,0,0,.45) z50 flex column justify:flex-end}`; card `bg var(--surface) radius24 24 0 0 max-height85vh flex column overflow:hidden` (`:111-112`); handle `36x4 bg var(--border) radius999 margin10 auto`.

### Empty State
- **Pattern:** `EmptyStateGuide` in `src/components/onboarding/EmptyState.tsx:14` — `card padding20 text-center`, icon `56 circle bg var(--surface2) 24px` centered, title `14/800`, description `12/16 var(--muted) max320 center`, hint `bg var(--accent-soft) color var(--accent) 12 pad8 12 radius10`, action `btn accent width100 minHeight44`. Used for `Belum ada produk` ☕ / `Belum ada pengeluaran` 💸 / `Belum ada penjualan` with `actionLabel` + `hint`. Never use gray illustration + outline ghost; the hint carries the recovery reason.
- **Rule:** One empty per viewport, always with a single accent action and optional warm hint — not a list of links.

### Toast / Feedback
- **Success (POS):** Bottom-sheet `text-center pad24` with `64 circle bg var(--green-soft) color var(--green) 28px ✓` (`src/app/(app)/pos/POSClient.tsx:203`), title `18/800`, total `24/800`, meta `var(--muted)` + `Selesai` `btn primary 48`. The only allowed toast for critical success; auto-dismiss is forbidden for money.
- **Inline feedback:** `bg var(--accent-soft) color var(--accent) 12 pad8 12 radius10` (empty-state hint pattern). For field validation, use adjacent text `12 var(--red)` under the field (see `ProductsClient.tsx:68` `setError`), not a colored left border.
- **Pending:** Primary button shows `Memproses...` disabled (`:191` `disabled={loading}`), never a spinner overlay.

### Confirmation Dialog
- **Style:** Bottom-sheet dialog, not `confirm()` or centered modal (current `confirm("Hapus produk?")` in `src/app/(app)/products/ProductsClient.tsx:74` is the anti-reference to replace). Card `pad20`, handle, title `16/700`, description `13 var(--text2)`, actions `flex gap8` → `ghost Batal` + `accent/danger Hapus` `minHeight44`. Scrim `rgba(0,0,0,.45)` — same as bottom-sheet. For destructive, danger uses `var(--red)` text on ghost or `bg var(--red)` when accent reserved.
- **Rule:** Confirmation needs protected focus (trapped in sheet); don't use `window.confirm` or auto-closing toast for destructive ops.

### Loading / Skeleton
- **Dashboard pattern:** `src/app/(app)/dashboard/loading.tsx:3` + `src/app/(app)/inventory/InventoryClient.tsx:43` — `display:grid gap12 + animation pulse 1.2s infinite` (`@keyframes pulse{0%{opacity1}50%{.6}100%{1}}`), cards `height120`, `grid-kpi 96`, `height140/180`. Always card-shaped skeletons matching the final layout, not spinners or generic gray bars. Pulse is the only motion allowed for skeleton; bar `width .4s ease` stays for real data.
- **Inventory card skeleton:** Same `14/gap10` card shell with gray blocks at hero (28px) and `surface2` row positions — keeps scan position stable.

### Error State
- **Field error:** `12 var(--red)` under `input` + `border var(--red)` on the field, helper `Masukkan nama` pattern (`ProductsClient` `setError`). Keep `var(--red-soft) #FDECEC` only for the field background tint, never for full-page wash.
- **Page/section error:** `card pad20 center` with `badge red` title `CRITICAL/OUT`, description `13 var(--text2)`, recovery `btn ghost Coba lagi`. For API failure, show `alert(await res.text())` legacy (`src/app/api/...`) replacement: inline error in sheet `12 var(--red)`.
- **Void/error list row:** Transaction void uses `StockMovementType VOID` red context; don't invent a new purple error.

## Do's and Don'ts

### Do:
- **Do** keep cream as page ground only — cards and sheets are always white with 1px warm-gray border (`DESIGN.md Colors The Ground Rule`).
- **Do** use the status pill pattern: `inline-flex gap5 padding4 8 radius999 bg {status}-soft color {status} + 6px dot` — compact, not a left-border stripe.
- **Do** make stock hero 28/800 -0.03em with `target` 11/600 var(--text2) beside it — answers "how much?" in 1s (`InventoryClient.tsx:394`).
- **Do** use the integrated `var(--surface2) radius12 pad10 12 grid 1fr auto` row for runway (`~N hari lagi` 12/700 + `Habis DD MMM • X/unit per hari` 11/var(--text2)) and cost (`BIAYA RESTOCK` 10/800 + `Rp` 13/800 + `qty • ke target` 10/var(--text2)).
- **Do** keep touch targets ≥40px (44 preferred) — inventory card actions `minHeight40`, qty buttons `44x44 radius10`.
- **Do** keep the 6px bar (`height6 #E5E3DE track` + status `bar` fill) — thin, not 8-12px sparklines.
- **Do** use tabular numerals for money/stock/percent via `.table td.num` and font-variant-numeric.
- **Do** keep one accent per card — if `Restock` is accent, `Detail` is ghost.

### Don't:
- **Don't** introduce a new visual pattern when an existing v1 primitive composes the solution — Empty State, Toast/Success, Confirmation (bottom-sheet dialog), Loading Skeleton, Error State, plus Buttons (primary/accent/ghost), Cards (16/14), Inputs, Chips, Segment, Badge, Stock Bar, Navigation, Bottom Sheet are the complete v1 vocabulary. Composition over creation.
- **Don't** use a colored `border-left` >1px on cards/list items — banned, use pill + bar instead.
- **Don't** use gradient text, glass/blur (except topbar), or hard offset `4px 4px` shadows — violates flat+tonal system.
- **Don't** duplicate copy on the card — no `%` label next to bar, no repeating `Target` + `BIAYA RESTOCK` on separate lines; target is compact inline, cost is in the integrated row only.
- **Don't** put SKU/avg-cost/min-stock on the card — move secondary to Detail sheet (WHAT/HOW MUCH, RUNWAY, Depletion Chart).
- **Don't** use muted (#9A9A9A) for 11-14px body text — use `var(--text2) #6B6B6B` to keep ≥4.5:1; muted is for 10px uppercase labels only.
- **Don't** introduce a new font family without replacing Inter system-wide — Inter is the sole display/body/label face (`src/app/layout.tsx:2`).
- **Don't** show `Neon/accent-soft` hover glows beyond `0 0 0 3px var(--accent-soft)` focus ring — no colored halos.
- **Don't** render bottom-nav on desktop — `display:none ≥901px` is invariant; desktop uses sidebar.
- **Don't** deviate from `DESIGN.md` + `.impeccable/design.json` as source of truth — when in doubt, compose from documented tokens/components; invent nothing.
