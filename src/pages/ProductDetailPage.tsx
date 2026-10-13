import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Product, Review } from '../types/ecommerce';
import { ProductCard } from '../components/ProductCard';
import { handleImageError, getProductImageUrl } from '../utils/imageUtils';
import {
  ShoppingBag,
  Zap,
  Star,
  Truck,
  ShieldCheck,
  RefreshCw,
  Minus,
  Plus,
  MessageCircle,
  ChevronLeft,
  Share2,
  Copy,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  PackageX,
  Sparkles,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const {
    selectedProductSlug,
    addToCart,
    setCurrentView,
    showToast,
    navigateToCheckout,
    navigateToProduct,
    navigateToCategory,
    settings,
  } = useShop();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Purchase options state
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Review submission state
  const [reviewName, setReviewName] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Share & Copy Link state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Derive target slug from context or window URL fallback
  const targetSlug =
    selectedProductSlug ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/product/')
      ? decodeURIComponent(window.location.pathname.replace('/product/', '').split('/')[0].trim())
      : null);

  useEffect(() => {
    if (!targetSlug) {
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${targetSlug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setRelated(data.related || []);
          setReviews(data.reviews || []);
          setActiveImageIndex(0);
          setQuantity(1);

          // Pre-select first variant options if variants exist
          if (data.product?.variants?.length) {
            const initialVariants: Record<string, string> = {};
            data.product.variants.forEach((v: any) => {
              if (v.options && v.options.length > 0) {
                initialVariants[v.name] = v.options[0];
              }
            });
            setSelectedVariants(initialVariants);
          } else {
            setSelectedVariants({});
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [targetSlug]);

  // Client-side SEO & Dynamic Document Meta Updates
  useEffect(() => {
    if (product) {
      const currentPrice = product.salePrice ?? product.regularPrice;
      const formattedTitle = `${product.name} (৳${currentPrice.toLocaleString('bn-BD')}) | ZX Shop`;
      document.title = formattedTitle;

      const rawDesc = (product.description || '').replace(/\s+/g, ' ').trim();
      const metaDesc = rawDesc.slice(0, 155) + (rawDesc.length > 155 ? '...' : '');

      const metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (metaDescriptionTag) {
        metaDescriptionTag.setAttribute('content', metaDesc);
      }

      const ogTitleTag = document.querySelector('meta[property="og:title"]');
      if (ogTitleTag) {
        ogTitleTag.setAttribute('content', formattedTitle);
      }

      const ogDescTag = document.querySelector('meta[property="og:description"]');
      if (ogDescTag) {
        ogDescTag.setAttribute('content', metaDesc);
      }

      const ogImageTag = document.querySelector('meta[property="og:image"]');
      if (ogImageTag && product.mainImage) {
        ogImageTag.setAttribute('content', product.mainImage);
      }
    } else {
      document.title = 'ZX Shop – আধুনিক বাংলা ই-কমার্স শপ';
    }
  }, [product]);

  const handleVariantSelect = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: option,
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity, selectedVariants);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity, selectedVariants);
    navigateToCheckout();
  };

  // Generate real permanent URL for this product
  const getProductUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/product/${product?.slug || product?.id}`;
  };

  // 1-Click Copy Link
  const handleCopyProductLink = async () => {
    const url = getProductUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('প্রোডাক্টের লিংক কপি করা হয়েছে!', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      showToast('লিংক কপি করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Trigger Share (Native Share or Modal)
  const handleShareTrigger = async () => {
    if (!product) return;
    const url = getProductUrl();
    const currentPrice = product.salePrice ?? product.regularPrice;
    const shareData = {
      title: product.name,
      text: `${product.name} - ZX Shop-এ বিশেষ মূল্য ৳${currentPrice.toLocaleString('bn-BD')}`,
      url: url,
    };

    // If mobile device supports Web Share API, open native sheet directly
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent || '')) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e: any) {
        // User aborted or unhandled error, open fallback modal
        if (e.name !== 'AbortError') {
          setIsShareModalOpen(true);
        }
        return;
      }
    }

    setIsShareModalOpen(true);
  };

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    if (!product) return;
    const url = getProductUrl();
    const currentPrice = product.salePrice ?? product.regularPrice;
    const message = `*${product.name}*\nমূল্য: ৳${currentPrice.toLocaleString('bn-BD')}\nবিস্তারিত ও অর্ডার করতে ভিজিট করুন:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Share to Facebook
  const handleShareFacebook = () => {
    const url = getProductUrl();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=450');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewName.trim() || !reviewComment.trim()) {
      showToast('আপনার নাম ও মন্তব্য প্রদান করুন।', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName: reviewName,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviews(prev => [data.review, ...prev]);
        setReviewName('');
        setReviewComment('');
        setReviewRating(5);
        showToast('আপনার মূল্যবান রিভিউ সফলভাবে গৃহীত হয়েছে!', 'success');
      } else {
        showToast('রিভিউ যোগ করতে সমস্যা হয়েছে।', 'error');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('সার্ভার সমস্যা, আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-10 bg-slate-200 rounded w-3/4" />
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-28 bg-slate-200 rounded w-full" />
            <div className="h-12 bg-slate-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found / Unavailable Product Page
  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="clay-card p-8 sm:p-12 bg-white flex flex-col items-center border border-rose-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 sm:mb-6 shadow-inner">
            <PackageX className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <span className="bg-rose-100 text-rose-700 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            পণ্যটি অনুপলব্ধ
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            পণ্যটি খুঁজে পাওয়া যায়নি!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-md leading-relaxed">
            আপনি যে পণ্যটি খুঁজছেন তা হয়তো সাময়িকভাবে আনপাবলিশ করা হয়েছে, স্টক শেষ হয়েছে অথবা লিংকটি পরিবর্তিত হয়েছে।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setCurrentView('products')}
              className="clay-btn-primary px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>সকল পণ্য ব্রাউজ করুন</span>
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="clay-btn-secondary px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer"
            >
              <span>হোম পেজে যান</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = product.salePrice ?? product.regularPrice;
  const hasDiscount = product.salePrice && product.salePrice < product.regularPrice;
  const discountAmount = hasDiscount ? product.regularPrice - product.salePrice! : 0;
  const isOutOfStock = product.stock <= 0;
  const allImages = product.images.length > 0 ? product.images : [product.mainImage];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8 sm:space-y-12 pb-24 md:pb-8">
      {/* Top Breadcrumb & Share Quick Action Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentView('products')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>সকল পণ্যে ফিরে যান</span>
        </button>

        {/* Quick Share Buttons Bar */}
        <div className="flex items-center gap-2">
          {/* Quick Copy Link Button */}
          <button
            onClick={handleCopyProductLink}
            className="clay-btn-secondary px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-rose-600 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            title="লিংক কপি করুন"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'কপি হয়েছে!' : 'লিংক কপি'}</span>
          </button>

          {/* Share Modal Trigger */}
          <button
            onClick={handleShareTrigger}
            className="clay-btn-secondary px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-rose-600 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            title="বন্ধুদের সাথে শেয়ার করুন"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-600" />
            <span>শেয়ার করুন</span>
          </button>
        </div>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Gallery Column (6 Cols) */}
        <div className="lg:col-span-6 space-y-3 sm:space-y-4">
          {/* Active Big Image (Preserves natural product proportions with clean object-contain) */}
          <div className="w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-[#f8fafc] sm:bg-white clay-card p-3 sm:p-5 relative flex items-center justify-center border border-slate-100 shadow-sm">
            <img
              src={getProductImageUrl(allImages[activeImageIndex] || product.mainImage)}
              alt={product.name}
              className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl drop-shadow-sm transition-all duration-200"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                ৳{discountAmount.toLocaleString('bn-BD')} ছাড়
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1.5 scrollbar-none">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 p-1 bg-white cursor-pointer ${
                    activeImageIndex === idx ? 'border-rose-600 scale-105 shadow-md' : 'border-slate-200 opacity-70'
                  }`}
                >
                  <img
                    src={getProductImageUrl(img)}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-contain p-0.5 rounded-lg"
                    onError={handleImageError}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Module Column (6 Cols) */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-5">
          {/* Title, SKU & Share Row */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
                <span className="font-semibold text-rose-600">SKU: {product.sku}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className={`font-semibold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isOutOfStock ? 'স্টক শেষ' : `ইন স্টক (${product.stock} টি উপলব্ধ)`}
                </span>
              </div>

              {/* Share Icon in header */}
              <button
                onClick={handleShareTrigger}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="শেয়ার করুন"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Rating Stars */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(product.rating || 5) ? 'fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-slate-800 num-bn">
                {product.rating || 5.0} রেটিং
              </span>
              <span className="text-slate-400 num-bn">
                ({reviews.length} টি রিভিউ)
              </span>
            </div>
          </div>

          {/* Pricing Box (Soft Peach Clay) */}
          <div className="clay-card-peach p-3.5 sm:p-4 border border-rose-200/60 rounded-2xl flex items-baseline justify-between gap-2.5 sm:gap-3">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-4xl font-black text-rose-600 num-bn">
                ৳{currentPrice.toLocaleString('bn-BD')}
              </span>
              {hasDiscount && (
                <span className="text-sm sm:text-base text-slate-400 line-through num-bn">
                  ৳{product.regularPrice.toLocaleString('bn-BD')}
                </span>
              )}
            </div>

            {hasDiscount && (
              <span className="text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                সেভ করুন ৳{discountAmount.toLocaleString('bn-BD')}
              </span>
            )}
          </div>

          {/* Variants Selectors (e.g. Size, Color) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-1">
              {product.variants.map((v) => (
                <div key={v.id || v.name} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    {v.name} নির্বাচন করুন:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt) => {
                      const isSelected = selectedVariants[v.name] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleVariantSelect(v.name, opt)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'clay-btn-primary shadow-sm scale-105'
                              : 'clay-btn-secondary text-slate-700 hover:text-rose-600'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-800 block">
              পরিমাণ (Quantity):
            </label>
            <div className="flex items-center gap-3">
              <div className="clay-card-flat flex items-center p-1 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-xs sm:text-sm text-slate-900 num-bn">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock || isOutOfStock}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-slate-500">
                সর্বমোট: <strong className="text-slate-900 num-bn">৳{(currentPrice * quantity).toLocaleString('bn-BD')}</strong>
              </span>
            </div>
          </div>

          {/* CTAs: Add to Cart and Buy Now */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`clay-btn-secondary py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer ${
                isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-rose-600" />
              <span>কার্টে যোগ করুন</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`clay-btn-primary py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-300' : ''
              }`}
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>এখনই অর্ডার করুন</span>
            </button>
          </div>

          {/* Quick Order via WhatsApp */}
          <div className="pt-0.5">
            <a
              href={`https://wa.me/${(settings?.whatsappNumber || '01711234567').replace(/[^0-9]/g, '')}?text=হ্যালো,%20আমি%20${encodeURIComponent(product.name)}%20(SKU:%20${product.sku})%20অর্ডার%20করতে%20চাই।`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp-এ সরাসরি অর্ডার করুন</span>
            </a>
          </div>

          {/* Delivery & Assurance Strip */}
          <div className="clay-card-flat p-3.5 bg-white border border-slate-100 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block text-xs">হোম ডেলিভারি</strong>
                <span className="text-[11px]">ঢাকা সিটিতে ১-২ কার্যদিবস, সারা দেশে ৩-৫ কার্যদিবস।</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block text-xs">ক্যাশ অন ডেলিভারি (COD)</strong>
                <span className="text-[11px]">পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন।</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block text-xs">সহজ রিটার্ন গ্যারান্টি</strong>
                <span className="text-[11px]">পণ্যে ত্রুটি থাকলে ৩ দিনের মধ্যে সহজে এক্সচেঞ্জ সুবিধা।</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Reviews Section */}
      <div className="clay-card p-5 sm:p-7 bg-white space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 border-b border-slate-200 pb-2.5 mb-3">
            পণ্যের পূর্ণ বিবরণ ও স্পেসিফিকেশন
          </h2>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        </div>

        {/* Customer Reviews & Form */}
        <div className="pt-5 border-t border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                গ্রাহক রিভিউ ও রেটিং ({reviews.length})
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">আপনার নিজস্ব অভিজ্ঞতা সবার সাথে শেয়ার করুন</p>
            </div>
          </div>

          {/* Add Review Form */}
          <form onSubmit={handleSubmitReview} className="clay-card-flat p-4 bg-slate-50 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              আপনার মতামত লিখুন:
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">আপনার নাম:</label>
                <input
                  type="text"
                  required
                  value={reviewName}
                  onChange={e => setReviewName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ"
                  className="w-full clay-inset px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">রেটিং (স্টার):</label>
                <select
                  value={reviewRating}
                  onChange={e => setReviewRating(Number(e.target.value))}
                  className="w-full clay-inset px-3 py-1.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (৫ স্টার - অসাধারণ)</option>
                  <option value={4}>⭐⭐⭐⭐ (৪ স্টার - ভালো)</option>
                  <option value={3}>⭐⭐⭐ (৩ স্টার - সন্তোষজনক)</option>
                  <option value={2}>⭐⭐ (২ স্টার - গড়পড়তা)</option>
                  <option value={1}>⭐ (১ স্টার - খারাপ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">মন্তব্য:</label>
              <textarea
                required
                rows={2}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="পণ্যের মান ও ডেলিভারি কেমন ছিল বিস্তারিত লিখুন..."
                className="w-full clay-inset px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="clay-btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
            >
              {isSubmittingReview ? 'জমা দেওয়া হচ্ছে...' : 'রিভিউ সাবমিট করুন'}
            </button>
          </form>

          {/* Existing Reviews List */}
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                এখনও কোনো রিভিউ দেওয়া হয়নি। আপনিই প্রথম রিভিউ দিন!
              </p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{r.customerName}</span>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < r.rating ? 'fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    {new Date(r.createdAt).toLocaleDateString('bn-BD')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* A. Related Products Section ("এই ধরনের আরও পণ্য" / "আপনার পছন্দ হতে পারে") */}
      {related.length > 0 && (
        <section className="space-y-4 sm:space-y-5 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-rose-600 uppercase tracking-widest mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>আপনার পছন্দ হতে পারে</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                এই ধরনের আরও পণ্য
              </h2>
            </div>
            
            <button
              onClick={() => {
                if (product?.category) {
                  navigateToCategory(product.category);
                } else {
                  setCurrentView('products');
                }
              }}
              className="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>আরও দেখুন</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2 columns on mobile, 3 on tablet, 4 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* B. Product Share Modal (Claymorphism 3D) */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="clay-card p-5 sm:p-6 bg-white w-full max-w-md space-y-4 sm:space-y-5 relative shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-rose-600 uppercase tracking-wider mb-1">
                <Share2 className="w-3.5 h-3.5" />
                <span>প্রোডাক্ট শেয়ার</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                বন্ধুদের সাথে শেয়ার করুন
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                সোশ্যাল মিডিয়া বা সরাসরি লিংকের মাধ্যমে পণ্যটি শেয়ার করুন
              </p>
            </div>

            {/* Product Mini Preview Box */}
            <div className="clay-card-flat p-3 bg-slate-50 flex items-center gap-3 rounded-xl border border-slate-100">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                <img
                  src={getProductImageUrl(product.mainImage)}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                  onError={handleImageError}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</h4>
                <span className="text-xs font-black text-rose-600 num-bn">
                  ৳{currentPrice.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            {/* Copy Link Row */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                সরাসরি প্রোডাক্ট লিংক:
              </label>
              <div className="clay-inset p-1.5 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getProductUrl()}
                  className="bg-transparent w-full text-[11px] text-slate-700 focus:outline-none px-2 select-all font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyProductLink}
                  className="clay-btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{copiedLink ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>
            </div>

            {/* Social Share Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* WhatsApp Share */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="clay-btn-mint p-2.5 sm:p-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp শেয়ার</span>
              </button>

              {/* Facebook Share */}
              <button
                type="button"
                onClick={handleShareFacebook}
                className="clay-btn-sky p-2.5 sm:p-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Facebook শেয়ার</span>
              </button>
            </div>

            {/* Native Mobile Share Button if supported */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: product.name,
                      text: `${product.name} - ZX Shop এ মূল্য ৳${currentPrice.toLocaleString('bn-BD')}`,
                      url: getProductUrl(),
                    });
                    setIsShareModalOpen(false);
                  } catch {}
                }}
                className="w-full clay-btn-secondary py-2.5 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-rose-600" />
                <span>অন্যান্য অ্যাপে শেয়ার করুন</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom CTA Bar (Instant Buy / Add to Cart from anywhere on PDP) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-[0_-6px_20px_rgba(160,175,205,0.22)]">
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-rose-600 num-bn">
              ৳{currentPrice.toLocaleString('bn-BD')}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-slate-400 line-through num-bn">
                ৳{product.regularPrice.toLocaleString('bn-BD')}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-semibold truncate ${isOutOfStock ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isOutOfStock ? 'স্টক শেষ' : `ইন স্টক (${product.stock} টি)`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`clay-btn-secondary px-3 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
            <span>কার্ট</span>
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={`clay-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer ${
              isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-300' : ''
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>এখনই অর্ডার</span>
          </button>
        </div>
      </div>
    </div>
  );
};
