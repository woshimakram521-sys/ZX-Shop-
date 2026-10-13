import React from 'react';
import { Product } from '../types/ecommerce';
import { useShop } from '../context/ShopContext';
import { ShoppingBag, Star, Eye, Check } from 'lucide-react';
import { handleImageError, getProductImageUrl } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, navigateToProduct, cart } = useShop();

  const isOutOfStock = product.stock <= 0;
  const currentPrice = product.salePrice ?? product.regularPrice;
  const hasDiscount = product.salePrice && product.salePrice < product.regularPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.regularPrice - product.salePrice!) / product.regularPrice) * 100)
    : 0;

  // Check if this product is already in the cart
  const inCartItem = cart.find(item => item.product.id === product.id);

  return (
    <div className="clay-card p-3 sm:p-4 flex flex-col justify-between group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl border border-white/90">
      {/* Discount badge if applicable (Clay 3D pill) */}
      {hasDiscount && (
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-[2px_3px_8px_rgba(244,63,94,0.35)] border border-rose-400/40">
          {discountPercent}% ছাড়
        </div>
      )}

      {/* Out of stock badge */}
      {isOutOfStock && (
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 bg-slate-800 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
          স্টক শেষ
        </div>
      )}

      {/* Image Container with Fallback & Tactile Frame (Preserves natural aspect ratio with object-contain) */}
      <div
        onClick={() => navigateToProduct(product.slug || product.id)}
        className="w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#f8fafc] relative cursor-pointer mb-2.5 sm:mb-3 flex items-center justify-center p-2.5 sm:p-3 shadow-[inset_1px_1px_3px_rgba(160,175,200,0.12)] border border-slate-100/80"
      >
        <img
          src={getProductImageUrl(product.mainImage || product.images?.[0])}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl sm:rounded-2xl">
          <span className="clay-btn-secondary px-3.5 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-md">
            <Eye className="w-3.5 h-3.5 text-rose-600" /> বিস্তারিত
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata row: SKU & Stock status */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
            <span className="font-semibold text-rose-600 tracking-wide font-mono">{product.sku}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className={isOutOfStock ? 'text-rose-500 font-bold' : product.stock <= 5 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
              {isOutOfStock ? 'স্টক নেই' : product.stock <= 5 ? `মাত্র ${product.stock} টি বাকি` : `স্টক: ${product.stock} টি`}
            </span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => navigateToProduct(product.slug || product.id)}
            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-rose-600 transition-colors cursor-pointer mb-1.5 leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2.5 text-[11px] sm:text-xs text-slate-600">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                    i < Math.floor(product.rating || 5) ? 'fill-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-slate-800 num-bn">({product.rating || 5.0})</span>
            {product.reviewCount ? (
              <span className="text-slate-400 num-bn hidden sm:inline">· {product.reviewCount} রিভিউ</span>
            ) : null}
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2.5 border-t border-slate-100/90 flex items-center justify-between gap-1 mt-auto">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5">
              <span className="text-sm sm:text-lg font-black text-rose-600 num-bn leading-tight">
                ৳{currentPrice.toLocaleString('bn-BD')}
              </span>
              {hasDiscount && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through num-bn leading-tight">
                  ৳{product.regularPrice.toLocaleString('bn-BD')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={isOutOfStock}
            className={`clay-btn-primary px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shrink-0 ${
              isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-300 shadow-none' : ''
            }`}
            title="কার্টে যোগ করুন"
          >
            {inCartItem ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">যুক্ত</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">কার্ট</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
