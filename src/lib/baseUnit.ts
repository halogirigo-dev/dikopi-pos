// Base-unit helpers for inventory.
//
// The single source of truth is InventoryItem.unit — the base (smallest) unit:
// g, ml, pcs, shot. All stock quantities and average_cost are stored in base
// units. When a purchase is entered in a larger "purchase unit" (liter, kg),
// the receiving boundary converts it to base units via UNIT_TO_BASE.
//
// Existing rows are NOT re-baselined: they keep their current unit as the
// base unit (kg stays kg, liter stays liter). New items are encouraged to use
// g/ml/pcs as base; the purchase route accepts an optional purchase_unit so
// stock can be received in pack/liter units without touching stored data.

export const UNIT_TO_BASE: Record<string, { base: string; factor: number }> = {
  liter: { base: "ml", factor: 1000 },
  l: { base: "ml", factor: 1000 },
  kg: { base: "g", factor: 1000 },
};

/**
 * Resolve a purchase amount to base units.
 *
 * - quantity: entered in `purchaseUnit` (e.g. 2 liter)
 * - purchaseUnit: optional larger unit the purchase is entered in
 * - itemUnit: the item's base unit of record (e.g. "ml")
 *
 * Returns { baseQuantity, baseUnit, perBaseUnitCost } where
 * perBaseUnitCost = unitCost / factor (cost per base unit).
 *
 * If purchaseUnit is null/undefined, or equals itemUnit, or has no known
 * conversion to itemUnit, the input is already in the base unit: factor = 1.
 */
export function toBaseUnit(
  quantity: number,
  unitCost: number,
  itemUnit: string,
  purchaseUnit?: string | null
): { baseQuantity: number; baseUnit: string; perBaseUnitCost: number; factor: number } {
  const norm = (u: string) => u.trim().toLowerCase();
  const base = norm(itemUnit);
  let factor = 1;
  if (purchaseUnit) {
    const p = norm(purchaseUnit);
    if (p !== base) {
      // Direct conversion (liter->ml, kg->g)
      const direct = UNIT_TO_BASE[p];
      if (direct && norm(direct.base) === base) {
        factor = direct.factor;
      } else if (direct && UNIT_TO_BASE[base] && norm(direct.base) === norm(UNIT_TO_BASE[base].base)) {
        // purchase unit and item unit are both larger forms of the same base
        // e.g. purchase "kg", item "kg" already handled above; this branch is
        // defensive and keeps factor 1.
        factor = 1;
      } else {
        // Unknown pair: treat input as already in base unit (no conversion).
        factor = 1;
      }
    }
  }
  const baseQuantity = quantity * factor;
  const perBaseUnitCost = factor > 0 ? unitCost / factor : unitCost;
  return { baseQuantity, baseUnit: base, perBaseUnitCost, factor };
}
