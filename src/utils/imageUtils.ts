/**
 * ZX Shop Image Utilities
 * Provides resilient, self-contained placeholders and fail-safe image error handlers.
 */

// Modern, neutral SVG placeholder as Data URI (requires zero HTTP requests, never 404s, never loops)
export const FALLBACK_PRODUCT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="none">
  <rect width="600" height="600" fill="#f8fafc"/>
  <rect x="40" y="40" width="520" height="520" rx="32" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2"/>
  <circle cx="300" cy="260" r="70" fill="#e2e8f0"/>
  <path d="M300 215C286.193 215 275 226.193 275 240C275 253.807 286.193 265 300 265C313.807 265 325 253.807 325 240C325 226.193 313.807 215 300 215Z" fill="#94a3b8"/>
  <path d="M250 330C250 302.386 272.386 280 300 280C327.614 280 350 302.386 350 330V335H250V330Z" fill="#94a3b8"/>
  <path d="M230 380H370" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/>
  <text x="300" y="430" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#64748b" letter-spacing="1">ZX SHOP</text>
  <text x="300" y="460" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">পণ্য প্রিভিউ</text>
</svg>
`)}`;

/**
 * Graceful error handler for <img onError={handleImageError} />
 * Prevents infinite error loops and guarantees a clean, uncropped placeholder.
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.dataset.fallbackApplied === 'true') {
    return;
  }
  target.dataset.fallbackApplied = 'true';
  target.src = FALLBACK_PRODUCT_IMAGE;
};

/**
 * Returns a valid URL or the default fallback image
 */
export const getProductImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return FALLBACK_PRODUCT_IMAGE;
  }
  return url.trim();
};

/**
 * Compresses large camera/gallery image files into web-optimized data URLs
 * Ensures fast, lightweight uploads from any smartphone or desktop browser.
 */
export const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      // Fallback timeout to prevent any hanging promises
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => resolve((fallbackReader.result as string) || '');
      fallbackReader.onerror = () => resolve('');
      fallbackReader.readAsDataURL(file);
    }, 7000);

    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      clearTimeout(timeout);
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      clearTimeout(timeout);
      try {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        }
      } catch {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
};
