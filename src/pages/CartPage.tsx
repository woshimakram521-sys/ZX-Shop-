import React from 'react';
import { useShop } from '../context/ShopContext';
import { ShoppingBag, Trash2, ArrowRight, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { handleImageError, getProductImageUrl } from '../utils/imageUtils';

export const CartPage: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    setCurrentView,
    navigateToCheckout,
    settings,
  } = useShop();

  const freeShippingTarget = settings?.freeDeliveryThreshold || 3000;
  const remainingForFreeShipping = Math.max(0, freeShippingTarget - cartSubtotal);
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingTarget) * 100));

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="clay-card p-8 sm:p-12 bg-white flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 sm:mb-6 shadow-inner">
            <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5">
            আপনার শপিং কার্ট খালি!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm">
            আপনি এখনও কোনো পণ্য কার্টে যোগ করেননি। আমাদের নতুন কালেকশন ঘুরে দেখুন এবং পছন্দের পণ্য বেছে নিন।
          </p>
          <button
            onClick={() => setCurrentView('products')}
            className="clay-btn-primary px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer"
          >
            <span>পণ্য কালেকশন দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
          শপিং কার্ট ({cart.length} টি আইটেম)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">অর্ডার নিশ্চিত করার আগে পণ্যের পরিমাণ ও সাইজ যাচাই করুন</p>
      </div>

      {/* Free shipping banner */}
      <div className="clay-card-flat p-3.5 sm:p-4 bg-white border border-rose-100 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-1.5 text-rose-600">
            <Truck className="w-4 h-4 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              {remainingForFreeShipping > 0
                ? `আর মাত্র ৳${remainingForFreeShipping.toLocaleString('bn-BD')} টাকার পণ্য যোগ করলে ফ্রি ডেলিভারি!`
                : 'অভিনন্দন! আপনি পাচ্ছেন ফ্রি ডেলিভারি সুবিধা!'}
            </span>
          </div>
          <span className="num-bn">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-rose-600 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
        {/* Cart items list (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="clay-card p-4 sm:p-6 bg-white space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                নির্বাচিত পণ্যের তালিকা
              </span>
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব কার্ট খালি করুন</span>
              </button>
            </div>

            <div className="space-y-3.5 divide-y divide-slate-100">
              {cart.map((item, idx) => {
                const price = item.product.salePrice ?? item.product.regularPrice;
                const itemTotal = price * item.quantity;
                const variantKeys = Object.keys(item.selectedVariants || {});

                return (
                  <div key={idx} className="pt-3.5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    {/* Image & Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-50 border border-slate-100 shrink-0 p-1.5 flex items-center justify-center overflow-hidden">
                        <img
                          src={getProductImageUrl(item.product.mainImage || item.product.images?.[0])}
                          alt={item.product.name}
                          className="max-h-full max-w-full object-contain"
                          onError={handleImageError}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.product.name}
                        </h3>
                        {variantKeys.length > 0 && (
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-1">
                            {variantKeys.map(k => (
                              <span key={k} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold text-slate-700">
                                {k}: {item.selectedVariants[k]}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-xs font-bold text-rose-600 mt-0.5 block num-bn">
                          একক মূল্য: ৳{price.toLocaleString('bn-BD')}
                        </span>
                      </div>
                    </div>

                    {/* Stepper & Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-50">
                      {/* Stepper */}
                      <div className="clay-card-flat flex items-center p-1 bg-white border border-slate-200 rounded-xl">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedVariants)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-rose-600 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-slate-900 num-bn">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedVariants)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total */}
                      <span className="text-xs sm:text-sm font-black text-slate-900 w-20 sm:w-24 text-right num-bn">
                        ৳{itemTotal.toLocaleString('bn-BD')}
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedVariants)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="clay-card p-5 sm:p-6 bg-white space-y-4 sm:space-y-5">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2.5">
              অর্ডার সারাংশ
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>পণ্যের মোট মূল্য:</span>
                <span className="font-bold text-slate-900 num-bn">
                  ৳{cartSubtotal.toLocaleString('bn-BD')}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>ডেলিভারি চার্জ:</span>
                <span className="text-slate-500 italic">চেকআউটে এলাকা অনুযায়ী হিসাব হবে</span>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-sm sm:text-base font-black text-slate-900">
                <span>সাব-টোটাল:</span>
                <span className="text-rose-600 num-bn text-lg sm:text-xl">
                  ৳{cartSubtotal.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            <button
              onClick={navigateToCheckout}
              className="w-full clay-btn-primary py-3 sm:py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>চেকআউট করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentView('products')}
              className="w-full clay-btn-secondary py-2.5 px-4 text-xs font-bold text-slate-700 text-center cursor-pointer"
            >
              আরও পণ্য কিনুন
            </button>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>নিরাপদ চেকআউট ও ক্যাশ অন ডেলিভারি</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
