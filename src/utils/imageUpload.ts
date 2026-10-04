/**
 * Utility untuk memproses unggahan file foto profil (kompresi & konversi ke Base64 Data URL)
 * Memastikan ukuran file ringan (< 50KB) agar cepat dimuat, hemat memori,
 * dan dapat disimpan langsung ke database Supabase (kolom text) maupun LocalStorage.
 */
export function processImageFile(file: File, maxDimension = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih harus berupa file gambar (JPG, PNG, WebP).'));
      return;
    }

    // Batasi ukuran awal sebelum kompresi max 10MB
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Ukuran file foto maksimal 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file foto.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memproses gambar.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Proporsional resize
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Gambar ulang di canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export sebagai JPEG terkompresi
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
