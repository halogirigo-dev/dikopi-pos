# Supabase Setup — Dikopi POS

## 1. Buat Project Supabase (2 menit)

1. Buka https://supabase.com → **New project**
2. Pilih org, beri nama `dikopi-pos`, password DB kuat (simpan!), region **Southeast Asia (Singapore)** / terdekat
3. Tunggu ±1 menit provisioning

## 2. Ambil Connection String

Project → **Settings** (gear) → **Database** → **Connection string** → tab **URI**

- **Pooled (untuk Vercel)**: host `aws-0-xxx.pooler.supabase.com:6543` + `?pgbouncer=true`  ← pakai ini untuk `DATABASE_URL`
- **Direct (untuk migrate lokal)**: port `5432` ← pakai sebagai `DIRECT_URL` jika ada

Contoh pooled:
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Copy password yang kamu set saat create project. Jika lupa: **Database → Reset database password**.

## 3. Set ENV Lokal

```bash
cp .env.example .env
# edit .env, isi DATABASE_URL dengan pooled string di atas
# isi NEXTAUTH_SECRET: openssl rand -base64 32
```

## 4. Migrasi Schema ke Supabase

Di repo ini schema sudah `provider = "postgresql"` (siap Supabase). Jalankan:

```bash
npm --cache /tmp/npm-cache install
npx prisma generate
# push schema (tanpa file migration, cepat untuk MVP)
npx prisma db push

# seed data awal (admin / kasir)
npx tsx prisma/seed.ts
```

Cek di Supabase → **Table Editor** akan muncul tabel: `User`, `Category`, `Product`, `Transaction`, dll.

Jika `db push` error `Can't reach database`, coba ganti ke **DIRECT_URL** (5432) tanpa `?pgbouncer=true`, atau cek IP allowlist (Supabase sekarang open by default).

## 5. Vercel Deploy

Vercel → Project → **Settings → Environment Variables**:

- `DATABASE_URL` = pooled string (6543)
- `NEXTAUTH_URL` = `https://your-domain.vercel.app`
- `NEXTAUTH_SECRET` = sama dengan lokal
- (opsional) `NEXT_PUBLIC_SUPABASE_URL` etc.

Redeploy.

## 6. Local Development dengan Supabase

Tetap bisa pakai Supabase langsung, tidak perlu SQLite lagi. Jika ingin tetap pakai SQLite lokal, ganti di `prisma/schema.prisma` provider ke `sqlite` dan `DATABASE_URL="file:./dev.db"` sementara, tapi untuk push ke production wajib `postgresql`.

## Troubleshooting

- `P1000 Authentication failed` → password salah, cek URL encode jika ada karakter spesial (`@`, `#` perlu `%40` `%23`)
- `P1001 Can't reach` → coba direct port 5432, cek firewall
- `Enum already exists` → `npx prisma migrate reset` (hapus data!) jika schema pernah di-push dengan tipe berbeda

## Commit & Push

Setelah `.env` terisi (jangan commit `.env`!), commit schema postgresql:

```bash
git add prisma/schema.prisma .env.example SUPABASE_SETUP.md
git commit -m "chore: supabase postgresql ready"
git push origin main
```
