/**
 * Free stock placeholder images untuk menu (Unsplash - free to use)
 * Dipakai ketika product.image_url kosong.
 * Setiap kategori punya koleksi foto relevan, pemilihan deterministik via hash id/nama
 * supaya produk yg sama selalu dapat foto yg sama.
 */

export const PLACEHOLDERS: Record<string, string[]> = {
  Coffee: [
    // Latte art - Unsplash free
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&auto=format&q=80",
    // Coffee shop interior
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop&auto=format&q=80",
    // Coffee beans closeup
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=400&fit=crop&auto=format&q=80",
    // Latte art heart
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop&auto=format&q=80",
  ],
  "Non Coffee": [
    // Matcha latte
    "https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=400&h=400&fit=crop&auto=format&q=80",
    // Chocolate / cocoa drink
    "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&h=400&fit=crop&auto=format&q=80",
    // Green tea / matcha bowl
    "https://images.unsplash.com/photo-1564890369478-c89ca64c94ea?w=400&h=400&fit=crop&auto=format&q=80",
  ],
  Food: [
    // Croissant
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop&auto=format&q=80",
    // Sandwich / bakery
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop&auto=format&q=80",
  ],
  Snack: [
    // Fries
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop&auto=format&q=80",
    // Snack / chips
    "https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=400&h=400&fit=crop&auto=format&q=80",
  ],
};

// Fallback umum jika kategori tidak dikenal
const FALLBACK = PLACEHOLDERS.Coffee;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Ambil placeholder berdasarkan kategori + seed (id atau nama).
 * Deterministik: produk yang sama selalu dapat gambar yang sama.
 */
export function getPlaceholderForCategory(categoryName: string, seed: string): string {
  const list = PLACEHOLDERS[categoryName] ?? FALLBACK;
  const idx = hashString(seed) % list.length;
  return list[idx];
}

/**
 * Helper utama: kembalikan image_url asli jika ada, else placeholder stock.
 */
export function getProductImage(p: {
  id?: string;
  name: string;
  image_url?: string | null;
  category?: { name: string } | null;
  category_id?: string;
}): string {
  if (p.image_url && p.image_url.trim()) return p.image_url.trim();
  const cat = p.category?.name ?? "Coffee";
  const seed = p.id ?? p.name;
  return getPlaceholderForCategory(cat, seed);
}

/**
 * Untuk <img onError> fallback - jika cdn gagal, pakai picsum seeded (selalu tersedia).
 */
export function getFallbackPicsum(seed: string): string {
  const s = encodeURIComponent(seed);
  // picsum free, seeded deterministic, grayscale off
  return `https://picsum.photos/seed/dikopi-${s}/400/400`;
}
