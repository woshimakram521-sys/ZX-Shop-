import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Search, Truck, CheckCircle2, Clock, Package, AlertCircle, Phone, MapPin } from 'lucide-react';
import { OrderStatus } from '../types/ecommerce';
import { handleImageError, getProductImageUrl } from '../utils/imageUtils';

const ORDER_STAGES: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'pending', label: 'অর্ডার গ্রহণ করা হয়েছে', desc: 'অর্ডারটি আমাদের সার্ভারে গৃহীত হয়েছে' },
  { status: 'confirmed', label: 'নিশ্চিত করা হয়েছে', desc: 'কল দিয়ে অর্ডারটি কনফার্ম করা হয়েছে' },
  { status: 'processing', label: 'প্যাকেজিং ও প্রসেসিং', desc: 'পণ্য গুদাম থেকে প্যাকিং করা হচ্ছে' },
  { status: 'shipped', label: 'কুরিয়ারে পাঠানো হয়েছে', desc: 'ডেলিভারি পার্টনারের কাছে হস্তান্তর করা হয়েছে' },
  { status: 'delivered', label: 'ডেলিভারি সম্পন্ন', desc: 'সফলভাবে কাস্টমারের হাতে পৌঁছে দেওয়া হয়েছে' },
];

export const OrderTrackingPage: React.FC = () => {
  const { showToast } = useShop();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMsg('অর্ডার নম্বর ও মোবাইল নম্বর দুটোই প্রয়োজন।');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setTrackedOrder(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTrackedOrder(data);
      } else {
        setErrorMsg(data.error || 'অর্ডারটি খুঁজে পাওয়া যায়নি। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।');
      }
    } catch {
      setErrorMsg('সার্ভার যোগাযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStageIndex = trackedOrder ? getStageIndex(trackedOrder.orderStatus) : 0;
  const isCancelled = trackedOrder?.orderStatus === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Truck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          লাইভ অর্ডার ট্র্যাকিং
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          আপনার অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে বর্তমান অবস্থান জানুন
        </p>
      </div>

      {/* Tracking Form Box */}
      <div className="clay-card p-6 sm:p-8 bg-white max-w-xl mx-auto">
        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ইউনিক অর্ডার নম্বর (Order ID):
            </label>
            <div className="clay-inset px-3.5 py-2.5 flex items-center">
              <input
                type="text"
                required
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="যেমন: ZX-10294"
                className="w-full bg-transparent text-xs sm:text-sm text-slate-800 uppercase focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              অর্ডারের মোবাইল নম্বর:
            </label>
            <div className="clay-inset px-3.5 py-2.5 flex items-center">
              <Phone className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-transparent text-xs sm:text-sm text-slate-800 focus:outline-none num-bn"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full clay-btn-primary py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>অনুসন্ধান করা হচ্ছে...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>অর্ডার খুঁজুন</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Tracked Order Result */}
      {trackedOrder && (
        <div className="clay-card p-6 sm:p-8 bg-white space-y-8 animate-in fade-in duration-300">
          
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">অর্ডার নম্বর:</span>
                <span className="text-xl font-black text-rose-600 font-mono">
                  {trackedOrder.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                তারিখ: {new Date(trackedOrder.createdAt).toLocaleDateString('bn-BD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Current Status Pill */}
            <div>
              {isCancelled ? (
                <span className="px-4 py-1.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                  অর্ডার বাতিল (Cancelled)
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                  {ORDER_STAGES[currentStageIndex]?.label || trackedOrder.orderStatus}
                </span>
              )}
            </div>
          </div>

          {/* Stepper Timeline */}
          {!isCancelled ? (
            <div className="py-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6">
                ডেলিভারি অগ্রগতি টাইমলাইন
              </h3>
              
              <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8 ml-2">
                {ORDER_STAGES.map((stage, idx) => {
                  const isDone = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;

                  return (
                    <div key={stage.status} className="relative">
                      {/* Node Dot */}
                      <div
                        className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-md'
                            : isDone
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      {/* Stage info */}
                      <div>
                        <h4
                          className={`text-xs sm:text-sm font-bold ${
                            isCurrent
                              ? 'text-rose-600'
                              : isDone
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage.label}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs space-y-1">
              <p className="font-bold">এই অর্ডারটি বাতিল করা হয়েছে।</p>
              <p>কোনো জিজ্ঞাসা থাকলে অনুগ্রহ করে আমাদের কাস্টমার কেয়ারে যোগাযোগ করুন।</p>
            </div>
          )}

          {/* Items Preview */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              অর্ডারের আইটেম সমূহ
            </h4>
            <div className="space-y-2">
              {trackedOrder.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={getProductImageUrl(item.image)}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                        onError={handleImageError}
                      />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block line-clamp-1">{item.name}</span>
                      <span className="text-slate-400 num-bn">পরিমাণ: {item.quantity} টি</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 num-bn">
                    ৳{(item.price * item.quantity).toLocaleString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>মোট মূল্য:</span>
              <span className="text-rose-600 text-sm num-bn">
                ৳{trackedOrder.totalAmount?.toLocaleString('bn-BD')}
              </span>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
            <span>নিরাপত্তা স্বার্থে গ্রাহক নম্বর সুরক্ষিত: {trackedOrder.maskedPhone}</span>
            <span>এলাকা: {trackedOrder.deliveryArea}</span>
          </div>

        </div>
      )}
    </div>
  );
};
