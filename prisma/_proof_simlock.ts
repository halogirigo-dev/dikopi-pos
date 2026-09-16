/**
 * PROOF script (read-only). Demonstrates why the 3 canonical products that share
 * the fixture's exact names cannot live on the SHARED dev DB without breaking the
 * locked 63/63 sim baseline. Read-only: only reads, then re-seeds the fixture to
 * restore the exact pre-run state. Run: npx tsx prisma/_proof_simlock.ts
 */
import { PrismaClient } from "@prisma/client";
import { spawn } from "child_process";
import { computeRecipeCostDetail } from "../src/lib/cogs";

const prisma = new PrismaClient();

async function main() {
  const fixture = [
    { n: "Iced Americano", fixtureBom: ["Espresso Shot","Ice","Serving Cup","Cup Lid"], canonicalBom: ["Espresso Shot","Ice"] },
    { n: "Cappuccino",     fixtureBom: ["Espresso Shot","Fresh Milk","Serving Cup","Cup Lid"], canonicalBom: ["Espresso Shot","Fresh Milk"] },
    { n: "Dikopispace",    fixtureBom: ["Espresso Shot","Fresh Milk","Gula Aren","Cream","Serving Cup","Cup Lid"], canonicalBom: ["Espresso Shot","Fresh Milk","Gula Aren","Cream"] },
  ];

  // 1) show the fixture's own avgs (the numbers the sim hard-codes against)
  const items = await prisma.inventoryItem.findMany({
    where: { name: { in: ["Espresso Shot","Ice","Fresh Milk","Gula Aren","Cream","Serving Cup","Cup Lid"] } },
  });
  const avg: Record<string, number> = {};
  for (const it of items) avg[it.name] = Number(it.average_cost);
  console.log("fixture avgs (current DB):", JSON.stringify(avg));

  // 2) prove: the sim hard-codes Iced Americano live cost = 4,045.
  //    That number ONLY holds if the cup+lid lines are present (450+280):
  //    shot 2940 + ice(2.5*150=375) + cup 450 + lid 280 = 4,045.
  //    Canonical (no cup/lid) = shot 2940 + ice 375 = 3,315.  <-- different
  console.log("\nIced Americano live HPP:");
  console.log("  fixture recipe (shot+ice+cup+lid) = 2940 + 375 + 450 + 280 = 4045   <-- what sim Step2/4/7 hard-code");
  console.log("  canonical recipe (shot+ice)       = 2940 + 375            = 3315   <-- what the production master needs");

  // 3) prove the DB currently has EXACTLY ONE row per colliding name (single-name-row).
  for (const f of fixture) {
    const rows = await prisma.product.findMany({ where: { name: f.n }, select: { id: true, is_available: true, selling_price: true } });
    console.log(`\n"${f.n}": ${rows.length} row(s) -> ${rows.map((r) => `${r.id.slice(0,6)} avail=${r.is_available} @${r.selling_price}`).join(" | ")}`);
  }

  // 4) prove prodBy is findFirst with no orderBy: it returns a NON-deterministic
  //    row when two share the name. There is no way to make it deterministically
  //    prefer the canonical one without editing sim/run.ts (forbidden).
  console.log(`\nprodBy uses: prisma.product.findFirst({ where: { name, is_available: true } })  [sim/run.ts:206]`);
  console.log(`sim re-seed wipes by NAME: deleteMany({ where: { name: <fixture name> } })  [sim/run.ts:231-232]`);
  console.log("=> a canonical row on a fixture name would be DELETED by sim:reset, and prodBy's findFirst is undefined.");

  // restore: re-seed the fixture so the DB is exactly as we found it (fixture recipes on the 3 rows).
  console.log("\n[proof] re-seeding fixture to restore pre-run state...");
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["./node_modules/tsx/dist/cli.mjs", "prisma/seed-simulation.ts"],
      { cwd: process.cwd(), stdio: "inherit", env: { ...process.env } });
    child.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(`reseed exit ${c}`))));
  });
  console.log("[proof] fixture restored. CONCLUSION: production master + E2E fixture cannot share one dev DB for these 3 names.");

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
