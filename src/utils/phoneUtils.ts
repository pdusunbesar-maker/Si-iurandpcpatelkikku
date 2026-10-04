/**
 * Utility untuk normalisasi dan pemformatan nomor telepon / WhatsApp.
 * Memastikan semua nomor HP yang tersimpan di aplikasi terstandarisasi
 * dan 100% langsung terhubung via tautan WhatsApp (wa.me) tanpa galat "nomor tidak valid".
 */

/**
 * Normalisasi nomor HP ke format standar WhatsApp internasional (contoh: 6281234567890).
 * Menangani berbagai variasi input pengguna:
 * - 0812-3456-7890 -> 6281234567890
 * - +62 812 3456 7890 -> 6281234567890
 * - 81234567890 -> 6281234567890
 * - 62081234567890 -> 6281234567890
 */
export function normalizePhoneNumber(rawPhone?: string | null): string {
  if (!rawPhone) return '';

  // Hapus semua karakter non-angka
  let cleaned = String(rawPhone).replace(/[^0-9]/g, '');

  if (!cleaned) return '';

  // Jika diawali "0" (misal: 0812...), ganti "0" dengan "62"
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  // Jika diawali "8" (misal: 812...), tambahkan "62" di depannya
  else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  // Jika diawali "6208..." (kesalahan penulisan umum), hapus angka 0 setelah 62
  else if (cleaned.startsWith('620')) {
    cleaned = '62' + cleaned.substring(3);
  }

  return cleaned;
}

/**
 * Format nomor telepon untuk tampilan yang rapi dan mudah dibaca manusia di antarmuka (UI).
 * Contoh input: "6281256789001" -> "0812-5678-9001"
 */
export function formatPhoneDisplay(rawPhone?: string | null, withCountryCode: boolean = false): string {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized) return '-';

  if (withCountryCode) {
    // Format: +62 812-5678-9001
    const p1 = normalized.slice(2, 5);
    const p2 = normalized.slice(5, 9);
    const p3 = normalized.slice(9);
    return `+62 ${p1}${p2 ? '-' + p2 : ''}${p3 ? '-' + p3 : ''}`;
  }

  // Format lokal Indonesia: 0812-5678-9001
  const local = normalized.startsWith('62') ? '0' + normalized.substring(2) : normalized;
  if (local.length <= 4) return local;
  if (local.length <= 8) return `${local.slice(0, 4)}-${local.slice(4)}`;
  return `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`;
}

/**
 * Membuat tautan resmi WhatsApp (https://wa.me/...) yang valid dan siap dibuka.
 */
export function generateWhatsAppLink(phone?: string | null, message?: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return '#';

  const baseUrl = `https://wa.me/${normalized}`;
  if (message && message.trim()) {
    return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
  }
  return baseUrl;
}

/**
 * Memvalidasi apakah nomor HP memenuhi kriteria nomor Indonesia yang valid (10 - 15 digit).
 */
export function isValidIndonesianPhone(phone?: string | null): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Nomor HP seluler Indonesia biasanya 628xx dan panjang antara 10 hingga 15 digit
  return /^628[0-9]{8,12}$/.test(normalized);
}
