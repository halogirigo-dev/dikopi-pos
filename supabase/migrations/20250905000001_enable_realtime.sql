-- Supabase Realtime setup via CLI: supabase link --project-ref dpgagtknkcbrbeblitqf
-- Enabled publication and replica identity for realtime

alter publication supabase_realtime add table "Transaction";
alter publication supabase_realtime add table "TransactionItem";
alter publication supabase_realtime add table "Expense";
alter publication supabase_realtime add table "Product";
alter publication supabase_realtime add table "Category";
alter publication supabase_realtime add table "CashAdjustment";

alter table "Transaction" replica identity full;
alter table "TransactionItem" replica identity full;
alter table "Expense" replica identity full;
alter table "Product" replica identity full;
alter table "Category" replica identity full;
alter table "CashAdjustment" replica identity full;
