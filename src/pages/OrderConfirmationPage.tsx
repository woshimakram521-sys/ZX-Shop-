import React from 'react';
import { useShop } from '../context/ShopContext';
import { CheckCircle2, Truck, MessageCircle, ArrowRight, Home, Printer } from 'lucide-react';
import { handleImageError, getProductImageUrl } from '../utils/imageUtils';

export const OrderConfirmationPage: React.FC = () => {
  const { lastPlacedOrder, setCurrentView, settings } = useShop();

  if (!lastPlacedOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">কোনো সাম্প্রতিক অর্ডার নেই</h2>
        <button
          onClick={() => setCurrentView('home')}
          className="clay-btn-primary px-6 py-2.5 text-xs font-bold"
        >
          হোম পেজে ফিরে যান
        </button>
      </div>
    );
  }

  const order = lastPlacedOrder;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Success Hero Badge */}
      <div className="clay-card p-8 bg-white text-center flex flex-col items-center border border-emerald-100">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-[inset_2px_2px_6px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full mb-2">
          অর্ডার সফল হয়েছে!
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          ধন্যবাদ, {order.customer.fullName}!
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed mb-6">
          আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমাদের কাস্টমার প্রতিনিধি শীঘ্রই আপনার নম্বরে কল দিয়ে অর্ডারটি কনফার্ম করবেন।
        </p>

        {/* Unique Order Number Box */}
        <div className="clay-card-flat p-4 bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-sm flex flex-col items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            আপনার ইউনিক অর্ডার আইডি
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-wide mt-1 select-all font-mono">
            {order.orderNumber}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            (অর্ডার ট্র্যাকিংয়ের জন্য এই নম্বরটি সংরক্ষণ করুন)
          </span>
        </div>
      </div>

      {/* Itemized Order Details */}
      <div className="clay-card p-6 sm:p-8 bg-white space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            অর্ডারের বিবরণ ও রসিদ
          </h3>
          <span className="text-xs text-slate-400">
            {new Date(order.createdAt).toLocaleDateString('bn-BD', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Items List */}
        <div className="space-y-3 divide-y divide-slate-100">
          {order.items.map((item, idx) => (
            <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                  <img
                    src={getProductImageUrl(item.image)}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                    onError={handleImageError}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                  <span className="text-xs text-slate-500 num-bn">
                    পরিমাণ: {item.quantity} টি × ৳{item.price.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>
              <span className="font-bold text-slate-900 num-bn shrink-0">
                ৳{item.total.toLocaleString('bn-BD')}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Calculation Breakdown */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>সাবটোটাল:</span>
            <span className="font-semibold text-slate-900 num-bn">
              ৳{order.subtotal.toLocaleString('bn-BD')}
            </span>
          </div>

          {order.discount > 0 && (
            <div className="flex items-center justify-between text-emerald-600 font-semibold">
              <span>কুপন ছাড় ({order.couponCode}):</span>
              <span className="num-bn">-৳{order.discount.toLocaleString('bn-BD')}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-600">
            <span>ডেলিভারি চার্জ ({order.deliveryZoneName}):</span>
            <span className="font-semibold text-slate-900 num-bn">
              ৳{order.deliveryCharge.toLocaleString('bn-BD')}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base font-black text-slate-900">
            <span>সর্বমোট পরিশোধযোগ্য:</span>
            <span className="text-rose-600 text-xl num-bn">
              ৳{order.totalAmount.toLocaleString('bn-BD')}
            </span>
          </div>
        </div>

        {/* Delivery & Payment Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="clay-card-flat p-4 bg-slate-50 rounded-xl space-y-1">
            <h4 className="font-bold text-slate-800 text-xs mb-1">ডেলিভারির ঠিকানা:</h4>
            <p className="text-slate-700"><strong>নাম:</strong> {order.customer.fullName}</p>
            <p className="text-slate-700"><strong>মোবাইল:</strong> <span className="num-bn">{order.customer.phone}</span></p>
            <p className="text-slate-700"><strong>ঠিকানা:</strong> {order.customer.fullAddress}</p>
            <p className="text-slate-500"><strong>এলাকা:</strong> {order.customer.deliveryArea}</p>
          </div>

          <div className="clay-card-flat p-4 bg-slate-50 rounded-xl space-y-1">
            <h4 className="font-bold text-slate-800 text-xs mb-1">পেমেন্ট মেথড:</h4>
            <p className="text-slate-700">
              <strong>পদ্ধতি:</strong>{' '}
              {order.paymentMethod === 'cod'
                ? 'Cash on Delivery (ক্যাশ অন ডেলিভারি)'
                : order.paymentMethod === 'bkash'
                ? 'bKash (বিকাশ)'
                : 'Nagad (নগদ)'}
            </p>
            {order.transactionId && (
              <p className="text-slate-700">
                <strong>TrxID:</strong> <span className="font-mono">{order.transactionId}</span>
              </p>
            )}
            <p className="text-slate-700">
              <strong>পেমেন্ট স্ট্যাটাস:</strong>{' '}
              <span className="text-amber-600 font-bold">যাচাই প্রক্রিয়াধীন (Pending)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => {
            setCurrentView('track');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full sm:flex-1 clay-btn-primary py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          <span>অর্ডার ট্র্যাক করুন</span>
        </button>

        <a
          href={`https://wa.me/${(settings?.whatsappNumber || '01711234567').replace(/[^0-9]/g, '')}?text=হ্যালো,%20আমার%20অর্ডার%20নম্বর%20${order.orderNumber}।%20আমি%20অর্ডারটির%20আপডেট%20জানতে%20চাই।`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp-এ সাহায্য নিন</span>
        </a>

        <button
          onClick={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full sm:w-auto clay-btn-secondary py-3.5 px-4 text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4" />
          <span>হোমে যান</span>
        </button>
      </div>
    </div>
  );
};
