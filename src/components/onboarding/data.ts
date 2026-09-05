import { TourDef } from "./types";

// Level 2: Navigation tour - highlight real nav items
export const NAV_TOUR: TourDef = {
  id: "nav",
  steps: [
    {
      id: "nav-dashboard",
      target: '[data-onboarding="nav-dashboard"]',
      title: "Dashboard",
      description: "Ringkasan bisnis kamu. Lihat omzet, HPP, laba, pengeluaran, dan posisi kas hari ini.",
      icon: "◫",
    },
    {
      id: "nav-pos",
      target: '[data-onboarding="nav-pos"]',
      title: "POS — Catat Penjualan",
      description: "Setiap transaksi yang dicatat di sini jadi data untuk laporan keuangan otomatis.",
      icon: "＋",
    },
    {
      id: "nav-transactions",
      target: '[data-onboarding="nav-transactions"]',
      title: "Transaksi",
      description: "Riwayat semua penjualan. Filter tanggal, lihat detail, dan void jika perlu.",
      icon: "▤",
    },
    {
      id: "nav-finance",
      target: '[data-onboarding="nav-finance"]',
      title: "Finance",
      description: "Pantau laba rugi dan arus kas. Cocok untuk owner cek kesehatan keuangan.",
      icon: "◒",
    },
    {
      id: "nav-products",
      target: '[data-onboarding="nav-products"]',
      title: "Produk",
      description: "Kelola menu: nama, kategori, harga jual, dan HPP untuk hitung margin.",
      icon: "☕",
    },
  ],
};

export const POS_TOUR: TourDef = {
  id: "pos",
  steps: [
    {
      id: "pos-search",
      target: '[data-onboarding="pos-search"]',
      title: "Cari menu",
      description: "Ketik nama produk atau pilih kategori untuk filter cepat.",
      icon: "🔍",
    },
    {
      id: "pos-category",
      target: '[data-onboarding="pos-categories"]',
      title: "Filter kategori",
      description: "Tap All / Coffee / Non Coffee untuk lihat menu per kategori.",
      icon: "▦",
    },
    {
      id: "pos-product",
      target: '[data-onboarding="pos-product"]',
      title: "Tambah ke keranjang",
      description: "Klik '+ Tambah' pada kartu produk. Produk akan masuk ke keranjang.",
      icon: "☕",
    },
    {
      id: "pos-cart",
      target: '[data-onboarding="pos-cart"]',
      title: "Keranjang & total",
      description: "Cek jumlah item dan total. Tap 'Lihat Keranjang' untuk ubah qty.",
      icon: "🛒",
    },
    {
      id: "pos-pay",
      target: '[data-onboarding="pos-cart"]',
      title: "Bayar & simpan",
      description: "Setelah cek keranjang, pilih metode bayar (Cash/QRIS/Debit) dan 'Bayar' untuk mencatat transaksi.",
      icon: "💳",
    },
  ],
};

export const PRODUCTS_TOUR: TourDef = {
  id: "products",
  steps: [
    {
      id: "prod-add",
      target: '[data-onboarding="products-add"]',
      title: "Tambah produk",
      description: "Klik 'Add Product' untuk menu baru. Isi nama, kategori, harga jual.",
      icon: "＋",
    },
    {
      id: "prod-hpp",
      target: '[data-onboarding="products-hpp"]',
      title: "HPP — biaya produk",
      description: "HPP = biaya bikin 1 porsi (bahan + cup). Contoh: jual 18k, HPP 6k → laba 12k.",
      icon: "🧮",
    },
    {
      id: "prod-calc",
      target: '[data-onboarding="products-calc"]',
      title: "Kalkulator HPP",
      description: "Tap 'Hitung HPP' untuk breakdown komponen saat tambah produk. Total bisa langsung 'Pakai' sebagai HPP.",
      icon: "🧾",
      center: true,
    },
    {
      id: "prod-margin",
      target: '[data-onboarding="products-margin"]',
      title: "Cek margin",
      description: "Badge hijau ≥50% sehat, kuning ≥30% cukup, merah <30% tipis. Atur harga/HPP agar sehat.",
      icon: "📈",
    },
  ],
};

export const EXPENSES_TOUR: TourDef = {
  id: "expenses",
  steps: [
    {
      id: "exp-add",
      target: '[data-onboarding="expenses-add"]',
      title: "Catat pengeluaran",
      description: "Klik 'Tambah Pengeluaran' untuk biaya operasional seperti listrik, sewa, gaji.",
      icon: "−",
    },
    {
      id: "exp-category",
      target: '[data-onboarding="expenses-filter"]',
      title: "Filter & kategori",
      description: "Filter tanggal/bulan/kategori untuk lihat ringkasan per kategori. Data ini kurangi laba bersih.",
      icon: "▦",
    },
    {
      id: "exp-why",
      target: '[data-onboarding="expenses-summary"]',
      title: "Kenapa penting?",
      description: "Tanpa pengeluaran, laba bersih jadi tidak akurat. Catat rutin agar laporan benar.",
      icon: "💡",
    },
  ],
};

export const DASHBOARD_TOUR: TourDef = {
  id: "dashboard",
  steps: [
    {
      id: "dash-revenue",
      target: '[data-onboarding="dash-revenue"]',
      title: "Omzet",
      description: "Total penjualan di periode yang dipilih. Angka besar di atas = omzet hari ini/bulan ini.",
      icon: "💰",
    },
    {
      id: "dash-kpi",
      target: '[data-onboarding="dash-kpi"]',
      title: "HPP & Laba",
      description: "HPP = biaya produk terjual. Gross = Omzet - HPP. Net = Gross - Pengeluaran.",
      icon: "📊",
    },
    {
      id: "dash-cash",
      target: '[data-onboarding="dash-cash"]',
      title: "Posisi Kas",
      description: "Uang tunai yang ada sekarang: Saldo awal + semua pemasukan - semua pengeluaran + koreksi.",
      icon: "🏦",
    },
    {
      id: "dash-chart",
      target: '[data-onboarding="dash-chart"]',
      title: "Grafik & Top Produk",
      description: "Lihat tren 7 hari dan produk terlaris untuk atur stok & promo.",
      icon: "📈",
    },
  ],
};

export const TRANSACTIONS_TOUR: TourDef = {
  id: "transactions",
  steps: [
    {
      id: "trx-filter",
      target: '[data-onboarding="trx-filter"]',
      title: "Filter transaksi",
      description: "Pilih Hari ini / Bulan ini / Tanggal / Bulan. Semua transaksi bisa difilter cepat.",
      icon: "📅",
    },
    {
      id: "trx-search",
      target: '[data-onboarding="trx-search"]',
      title: "Cari invoice",
      description: "Ketik nomor invoice untuk cari transaksi tertentu.",
      icon: "🔍",
    },
    {
      id: "trx-detail",
      target: '[data-onboarding="trx-list"]',
      title: "Lihat detail",
      description: "Tap kartu transaksi untuk lihat item, HPP, gross, dan kembalian.",
      icon: "▤",
    },
    {
      id: "trx-void",
      target: '[data-onboarding="trx-list"]',
      title: "Void (Admin)",
      description: "Admin bisa void transaksi dengan alasan. Data tetap terekam sebagai VOID.",
      icon: "↩",
    },
  ],
};

export const REPORTS_TOUR: TourDef = {
  id: "reports",
  steps: [
    {
      id: "rep-period",
      target: '[data-onboarding="reports-filter"]',
      title: "Pilih periode",
      description: "Ganti periode (hari/bulan/kustom) untuk bandingkan performa.",
      icon: "📅",
    },
    {
      id: "rep-pnl",
      target: '[data-onboarding="reports-pnl"]',
      title: "Profit & Loss",
      description: "Sales Revenue - HPP = Gross. Gross - Expense = Net. Lihat margin juga.",
      icon: "◒",
    },
    {
      id: "rep-performance",
      target: '[data-onboarding="reports-performance"]',
      title: "Product Performance",
      description: "Tap 'Product Performance' untuk lihat pangsa revenue, HPP vs Gross, kesehatan margin, dan qty terjual.",
      icon: "◉",
    },
  ],
};

export const FINANCE_TOUR: TourDef = {
  id: "finance",
  steps: [
    {
      id: "fin-tabs",
      target: '[data-onboarding="finance-tabs"]',
      title: "Tab Finance",
      description: "3 tab: Overview (Ringkasan), Cashflow (In/Out), P&L (detail laba rugi).",
      icon: "↔",
    },
    {
      id: "fin-cash",
      target: '[data-onboarding="finance-cashflow"]',
      title: "Cashflow",
      description: "Cash In = penjualan + koreksi masuk. Cash Out = pengeluaran + koreksi keluar. Net = selisihnya.",
      icon: "💳",
    },
  ],
};

export const CASHFLOW_TOUR: TourDef = {
  id: "cashflow",
  steps: [
    {
      id: "cf-opening",
      target: '[data-onboarding="cashflow-opening"]',
      title: "Saldo awal & alur",
      description: "Saldo awal + penjualan - pengeluaran + koreksi = Closing Cash Position (kas sekarang).",
      icon: "🏦",
      center: true,
    },
  ],
};
