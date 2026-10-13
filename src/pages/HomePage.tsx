import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { handleImageError } from '../utils/imageUtils';
import {
  ArrowRight,
  ShoppingCart,
  Sparkles,
  Award,
  ShieldCheck,
  Truck,
  MessageCircle,
  Star,
  ChevronRight,
  Percent,
  RefreshCw,
  CreditCard,
  Shirt,
  Smartphone,
  Watch,
  Home,
  Baby,
  Dumbbell,
  BookOpen,
  Tag,
  Clock,
  Copy,
  Check,
} from 'lucide-react';

// Category color and icon mapping using the 4 requested pastel clay palettes
const categoryStyles: Record<string, { bg: string; icon: any; iconColor: string; labelColor: string }> = {
  'cat-1': { bg: 'clay-card-peach', icon: Shirt, iconColor: 'text-orange-600', labelColor: 'text-orange-950' },
  'cat-2': { bg: 'clay-card-lavender', icon: Sparkles, iconColor: 'text-purple-600', labelColor: 'text-purple-950' },
  'cat-3': { bg: 'clay-card-skyblue', icon: Smartphone, iconColor: 'text-sky-600', labelColor: 'text-sky-950' },
  'cat-4': { bg: 'clay-card-mint', icon: Home, iconColor: 'text-emerald-600', labelColor: 'text-emerald-950' },
  'cat-5': { bg: 'clay-card-skyblue', icon: Watch, iconColor: 'text-blue-600', labelColor: 'text-blue-950' },
  'cat-6': { bg: 'clay-card-peach', icon: Baby, iconColor: 'text-amber-600', labelColor: 'text-amber-950' },
  'cat-7': { bg: 'clay-card-mint', icon: Dumbbell, iconColor: 'text-teal-600', labelColor: 'text-teal-950' },
  'cat-8': { bg: 'clay-card-lavender', icon: BookOpen, iconColor: 'text-indigo-600', labelColor: 'text-indigo-950' },
};

export const HomePage: React.FC = () => {
  const {
    settings,
    categories,
    products,
    featuredProducts,
    popularProducts,
    navigateToCategory,
    setCurrentView,
    showToast,
  } = useShop();

  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Countdown timer for Deal of the Day
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 27, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Use all products pool for discounts and display
  const allPool = products && products.length > 0 ? products : [...featuredProducts, ...popularProducts];

  // Filter actual products with real discount from the database
  const discountedProducts = allPool
    .filter((p, index, self) => 
      p.salePrice && p.salePrice < p.regularPrice &&
      self.findIndex(t => t.id === p.id) === index
    )
    .slice(0, 4);

  // Trending & all published products for homepage display (so NO newly added product is hidden)
  const displayedHomeProducts = (popularProducts && popularProducts.length > 0)
    ? popularProducts
    : allPool;

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    showToast(`কুপন কোড '${code}' কপি করা হয়েছে!`, 'success');
    setTimeout(() => setCopiedCoupon(false), 3000);
  };

  return (
    <div className="space-y-10 sm:space-y-14 pb-12">
      {/* 1. Premium Compact Hero Showcase Banner (Claymorphism 3D) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[8px_14px_30px_rgba(160,175,205,0.25),-8px_-8px_20px_rgba(255,255,255,0.95)] border border-white bg-gradient-to-br from-white via-slate-50/60 to-rose-50/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 p-5 sm:p-8 lg:p-12 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-100 text-rose-600 rounded-full text-[11px] sm:text-xs font-bold mb-3 shadow-[2px_3px_6px_rgba(225,29,72,0.12),inset_1px_1px_1px_rgba(255,255,255,0.8)]">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-rose-500" style={{ animationDuration: '4s' }} />
                <span>প্রিমিয়াম অনলাইন শপিং · ১০০% আসল পণ্য</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-3 text-balance">
                {settings?.bannerTitle || 'আধুনিক লাইফস্টাইল ও কোয়ালিটি পণ্যের সমাহার'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 max-w-xl font-normal">
                {settings?.bannerSubtitle || '১০০% খাঁটি পণ্য, দ্রুততম হোম ডেলিভারি এবং সহজ ক্যাশ অন ডেলিভারি সুবিধা নিয়ে ZX Shop রয়েছে আপনার পাশে।'}
              </p>

              {/* Action Buttons with Claymorphism */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setCurrentView('products');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="clay-btn-primary px-5 sm:px-7 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 group shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>এখনই কিনুন</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    setCurrentView('track');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="clay-btn-secondary px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2"
                >
                  <Truck className="w-4 h-4 text-rose-600" />
                  <span>অর্ডার ট্র্যাক</span>
                </button>
              </div>

              {/* Quick Trust Highlights */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] sm:text-xs font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>ক্যাশ অন ডেলিভারি</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span>সারা দেশে ডেলিভারি</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span>১০০% আসল প্রোডাক্ট</span>
                </div>
              </div>
            </div>

            {/* Right Visual Image Showcase with Clay Frame */}
            <div className="lg:col-span-5 h-64 sm:h-80 lg:h-96 relative overflow-hidden bg-slate-50/40 flex items-center justify-center p-3 sm:p-6">
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),0_6px_20px_rgba(0,0,0,0.08)] border-2 border-white/90 relative">
                <img
                  src={settings?.bannerImage || '/src/assets/images/hero_ecommerce_banner_1791605905466.jpg'}
                  alt="ZX Shop Hero Showcase"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.dataset.fallbackApplied === 'true') return;
                    target.dataset.fallbackApplied = 'true';
                    target.src = '/src/assets/images/hero_ecommerce_banner_1791605905466.jpg';
                    target.onerror = () => handleImageError(e);
                  }}
                />
                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-md border border-white">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">ট্রেন্ডিং কালেকশন</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 block">স্মার্ট লাইফস্টাইল অ্যাক্সেসরিজ</span>
                  </div>
                  <button
                    onClick={() => setCurrentView('products')}
                    className="clay-btn-primary px-2.5 py-1 text-[10px] sm:text-xs font-bold"
                  >
                    দেখুন
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Categories Section (Pastel 3D Clay Cards: Soft Lavender, Sky Blue, Mint Green, Peach) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              পণ্য ক্যাটাগরি সমূহ
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              পছন্দের ক্যাটাগরি বেছে নিন এবং সহজেই প্রয়োজনীয় পণ্যটি খুঁজুন
            </p>
          </div>
          <button
            onClick={() => setCurrentView('products')}
            className="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3.5">
          {categories.map((cat) => {
            const style = categoryStyles[cat.id] || {
              bg: 'clay-card-flat',
              icon: Tag,
              iconColor: 'text-rose-600',
              labelColor: 'text-slate-900',
            };
            const Icon = style.icon;

            return (
              <button
                key={cat.id}
                onClick={() => navigateToCategory(cat.slug)}
                className={`${style.bg} p-3 sm:p-3.5 flex flex-col items-center justify-center text-center group cursor-pointer hover:scale-105 active:scale-95 transition-all`}
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white flex items-center justify-center mb-2 shadow-[2px_3px_6px_rgba(165,180,205,0.2),inset_1px_1px_2px_rgba(255,255,255,0.9)] ${style.iconColor} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className={`text-[11px] sm:text-xs font-bold ${style.labelColor} line-clamp-1 group-hover:text-rose-600 transition-colors`}>
                  {cat.banglaName}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Special Offers / Deal of the Day (With Urgency Timer) */}
      {discountedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="clay-card-peach p-4 sm:p-6 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-orange-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 text-[11px] font-black text-orange-600 uppercase tracking-widest">
                  স্পেশাল ডিল অফ দ্য ডে
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  বিশেষ ছাড় ও অফারের পণ্য
                </h2>
              </div>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-2 bg-white/90 px-3.5 py-1.5 rounded-xl shadow-sm border border-white">
              <Clock className="w-4 h-4 text-orange-600 shrink-0" />
              <span className="text-xs font-bold text-slate-600">অফার বাকি:</span>
              <div className="flex items-center gap-1 font-mono font-black text-xs text-slate-900 num-bn">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>:
                <span className="bg-slate-100 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>:
                <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {discountedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Popular Products Section (2 cols mobile, 4 cols desktop) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600 uppercase tracking-widest mb-0.5">
              <Award className="w-3.5 h-3.5" /> টপ সেলিং কালেকশন
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              জনপ্রিয় ট্রেন্ডিং পণ্য সমূহ
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('products')}
            className="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {displayedHomeProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Promotional Coupon Banner (Interactive Click-to-Copy) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="clay-card-flat bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shadow-[8px_12px_28px_rgba(225,29,72,0.25)] border border-white/20">
          <div className="text-center md:text-left">
            <span className="bg-white/20 text-white text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2 shadow-inner">
              সীমিত সময়ের বিশেষ অফার
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white mb-1.5">
              ১০% এক্সট্রা ডিসকাউন্ট! কুপন কোড: 
              <button
                onClick={() => handleCopyCoupon('ZX10')}
                className="ml-2 inline-flex items-center gap-1 bg-white text-rose-600 hover:bg-rose-50 px-3 py-0.5 rounded-xl font-mono shadow-sm cursor-pointer transition-transform active:scale-95 text-base sm:text-xl"
                title="ক্লিক করে কোড কপি করুন"
              >
                <span>ZX10</span>
                {copiedCoupon ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-rose-600" />}
              </button>
            </h3>
            <p className="text-xs sm:text-sm text-white/90">
              সর্বনিম্ন ১,০০০ টাকার অর্ডারে এই কুপন কোড ব্যবহার করে উপভোগ করুন ইনস্ট্যান্ট ক্যাশ ছাড়।
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentView('products');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-3 bg-white text-rose-600 hover:bg-slate-50 font-black rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-md whitespace-nowrap transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            অফার পণ্য কেনাকাটা
          </button>
        </div>
      </section>

      {/* 6. Trust Section (Safe ordering, payment, delivery, warranty) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="clay-card p-4 sm:p-5 bg-white text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 shadow-[inset_1px_1px_3px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">১০০% আসল প্রোডাক্ট</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">যাচাইকৃত ব্র্যান্ড ও কোয়ালিটি</p>
          </div>

          <div className="clay-card p-4 sm:p-5 bg-white text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 shadow-[inset_1px_1px_3px_rgba(2,132,199,0.2)]">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">ক্যাশ অন ডেলিভারি</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">পণ্য দেখে টাকা পরিশোধ</p>
          </div>

          <div className="clay-card p-4 sm:p-5 bg-white text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2.5 shadow-[inset_1px_1px_3px_rgba(225,29,72,0.2)]">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">দ্রুততম ডেলিভারি</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">ঢাকা ও দেশের ৬৪ জেলায় পার্সেল</p>
          </div>

          <div className="clay-card p-4 sm:p-5 bg-white text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 shadow-[inset_1px_1px_3px_rgba(217,119,6,0.2)]">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">সহজ রিটার্ন সুবিধা</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">৩ দিনের মধ্যে এক্সচেঞ্জ সাপোর্ট</p>
          </div>
        </div>
      </section>

      {/* 7. Customer Testimonials (Authentic Bengali feedback) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-md mx-auto mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            কাস্টমারদের বাস্তব অভিজ্ঞতা
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            সন্তুষ্ট গ্রাহকদের ভালোবাসা ও আস্থার বিবরণ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
          <div className="clay-card p-4 sm:p-5 flex flex-col justify-between bg-white">
            <div>
              <div className="flex text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed mb-3">
                "স্মার্টওয়াচটি হাতে পেয়ে খুব ভালো লাগলো। হুবহু ছবির মতো এবং প্যাকেজিং এক কথায় অসাধারণ ছিল। ডেলিভারিও পেয়েছি ২ দিনের মধ্যে।"
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">তানভীর আহমেদ</h4>
                <p className="text-[10px] text-slate-400">ধানমন্ডি, ঢাকা</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ভেরিফায়েড ক্রেতা</span>
            </div>
          </div>

          <div className="clay-card p-4 sm:p-5 flex flex-col justify-between bg-white">
            <div>
              <div className="flex text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed mb-3">
                "পাঞ্জাবির কাপড়ের কোয়ালিটি অনেক প্রিমিয়াম। সাইজের কোনো সমস্যা হয়নি। ক্যাশ অন ডেলিভারিতে চেক করে মূল্য দিতে পেরেছি।"
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">মেহেদী হাসান</h4>
                <p className="text-[10px] text-slate-400">উত্তরা, ঢাকা</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ভেরিফায়েড ক্রেতা</span>
            </div>
          </div>

          <div className="clay-card p-4 sm:p-5 flex flex-col justify-between bg-white">
            <div>
              <div className="flex text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed mb-3">
                "সিরামটি ১০০% অরিজিনাল। কাস্টমার সার্ভিসের ব্যবহার খুবই ভালো ছিল। WhatsApp-এ ট্র্যাকিং আপডেট পেয়েছি সময়মতো।"
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">ফারজানা ইয়াসমিন</h4>
                <p className="text-[10px] text-slate-400">চট্টগ্রাম</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ভেরিফায়েড ক্রেতা</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Floating WhatsApp Quick Action Button */}
      <a
        href={`https://wa.me/${(settings?.whatsappNumber || '01711234567').replace(/[^0-9]/g, '')}?text=হ্যালো,%20আমি%20ZX%20Shop%20থেকে%20একটি%20পণ্য%20সম্পর্কে%20জানতে%20চাই।`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-4 sm:right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-[0_8px_20px_rgba(16,185,129,0.4)] flex items-center gap-2 font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        aria-label="WhatsApp সরাসরি মেসেজ"
      >
        <MessageCircle className="w-5 h-5 fill-white" />
        <span className="hidden sm:inline">WhatsApp সহায়তা</span>
      </a>
    </div>
  );
};
