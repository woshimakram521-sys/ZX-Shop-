import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ShieldCheck, Truck, CreditCard, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { handleImageError, getProductImageUrl } from '../utils/imageUtils';

const BD_DIVISIONS = [
  'ঢাকা (Dhaka)',
  'চট্টগ্রাম (Chattogram)',
  'রাজশাহী (Rajshahi)',
  'খুলনা (Khulna)',
  'বরিশাল (Barishal)',
  'সিলেট (Sylhet)',
  'রংপুর (Rangpur)',
  'ময়মনসিংহ (Mymensingh)',
];

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    deliveryZones,
    settings,
    clearCart,
    setCurrentView,
    setLastPlacedOrder,
    showToast,
  } = useShop();

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('ঢাকা (Dhaka)');
  const [district, setDistrict] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [fullAddress, setFullAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-select first delivery zone
  useEffect(() => {
    if (deliveryZones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(deliveryZones[0].id);
    }
  }, [deliveryZones]);

  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId) || deliveryZones[0];

  // Calculate delivery fee
  let deliveryCharge = selectedZone ? selectedZone.rate : 60;
  if (settings?.freeDeliveryThreshold && cartSubtotal >= settings.freeDeliveryThreshold) {
    deliveryCharge = 0;
  }

  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, cartSubtotal - discount + deliveryCharge);

  // Handle coupon apply
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setIsApplyingCoupon(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          subtotal: cartSubtotal,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({ code: data.code, discount: data.discount });
        showToast(data.message, 'success');
      } else {
        setErrorMessage(data.message || 'কুপনটি সঠিক নয়।');
        showToast(data.message || 'কুপন কোড সঠিক নয়।', 'error');
      }
    } catch {
      showToast('কুপন যাচাই করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Submit Order
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setErrorMessage('সঠিক বাংলাদেশি ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    if (!fullAddress.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।');
      return;
    }

    if (paymentMethod !== 'cod' && !transactionId.trim()) {
      setErrorMessage(`${paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} ট্রানজ্যাকশন আইডি (TrxID) প্রদান করুন।`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          division,
          district: district.trim(),
          deliveryArea: selectedZone?.name || 'ঢাকা সিটির ভিতরে',
          fullAddress: fullAddress.trim(),
          notes: notes.trim(),
        },
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedVariants: item.selectedVariants,
        })),
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        senderPhone: senderPhone.trim() || undefined,
        deliveryZoneId: selectedZone?.id,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastPlacedOrder(data.order);
        clearCart();
        setCurrentView('order-success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(data.error || 'অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        showToast(data.error || 'অর্ডার প্রক্রিয়া করা যায়নি।', 'error');
      }
    } catch {
      setErrorMessage('সার্ভার যোগাযোগে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।');
      showToast('সার্ভার ত্রুটি, পুনরায় চেষ্টা করুন।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Back Link */}
      <div>
        <button
          onClick={() => setCurrentView('cart')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>কার্টে ফিরে যান</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          গেস্ট চেকআউট ও ডেলিভারি তথ্য
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          অ্যাকাউন্ট খোলা ছাড়াই মাত্র ১ মিনিটে অর্ডার সম্পন্ন করুন
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleOrderSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Customer & Delivery Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Delivery Contact Info */}
            <div className="clay-card p-6 bg-white space-y-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Truck className="w-4 h-4 text-rose-600" />
                <span>১. ডেলিভারি ও যোগাযোগ তথ্য</span>
              </h3>

              <div className="space-y-4 text-xs">
                {/* Full Name */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    আপনার পূর্ণ নাম <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="যেমন: মোঃ সাকিব আহমেদ"
                    className="w-full clay-inset px-3.5 py-2.5 text-slate-800 text-xs sm:text-sm focus:outline-none"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    মোবাইল নম্বর (১১ ডিজিট) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full clay-inset px-3.5 py-2.5 text-slate-800 text-xs sm:text-sm focus:outline-none num-bn"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    অর্ডার নিশ্চিতকরণ ও ডেলিভারির জন্য এই নম্বরে যোগাযোগ করা হবে।
                  </span>
                </div>

                {/* Division & District */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      বিভাগ (Division) <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={division}
                      onChange={e => setDivision(e.target.value)}
                      className="w-full clay-inset px-3 py-2.5 text-slate-800 text-xs sm:text-sm focus:outline-none cursor-pointer"
                    >
                      {BD_DIVISIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      জেলা (District) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      placeholder="যেমন: ঢাকা / গাজীপুর / চট্টগ্রাম"
                      className="w-full clay-inset px-3.5 py-2.5 text-slate-800 text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Zone Selector */}
                <div>
                  <label className="font-bold text-slate-700 block mb-2">
                    ডেলিভারি এলাকা নির্বাচন করুন <span className="text-rose-600">*</span>
                  </label>
                  <div className="space-y-2">
                    {deliveryZones.map(zone => (
                      <label
                        key={zone.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedZoneId === zone.id
                            ? 'border-rose-600 bg-rose-50/40 shadow-sm'
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="deliveryZone"
                            value={zone.id}
                            checked={selectedZoneId === zone.id}
                            onChange={() => setSelectedZoneId(zone.id)}
                            className="text-rose-600 focus:ring-rose-500 w-4 h-4"
                          />
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                              {zone.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              আনুমানিক সময়: {zone.estimatedDays}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-rose-600 num-bn">
                          ৳{zone.rate.toLocaleString('bn-BD')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Detailed Address */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা/থানা) <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={fullAddress}
                    onChange={e => setFullAddress(e.target.value)}
                    placeholder="যেমন: বাড়ি #১২, রোড #০৩, সেক্টর #০৭, উত্তরা, ঢাকা"
                    className="w-full clay-inset px-3.5 py-2.5 text-slate-800 text-xs sm:text-sm focus:outline-none"
                  />
                </div>

                {/* Delivery Note */}
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    অর্ডার বা ডেলিভারি নোট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="যেমন: সন্ধ্যার পর ডেলিভারি দিন..."
                    className="w-full clay-inset px-3.5 py-2 text-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="clay-card p-6 bg-white space-y-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="w-4 h-4 text-rose-600" />
                <span>২. পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
              </h3>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-rose-600 bg-rose-50/30 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                      ক্যাশ অন ডেলিভারি (Cash on Delivery)
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য কুরিয়ার এজেন্টের কাছে পরিশোধ করুন।
                    </span>
                  </div>
                </label>

                {/* bKash */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'bkash'
                      ? 'border-pink-600 bg-pink-50/40 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bkash"
                    checked={paymentMethod === 'bkash'}
                    onChange={() => setPaymentMethod('bkash')}
                    className="mt-1 text-pink-600 focus:ring-pink-500 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-pink-700">
                        বিকাশ পেমেন্ট (bKash)
                      </span>
                      <span className="text-[11px] font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded">
                        {settings?.bkashType || 'Personal'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      আমাদের বিকাশ নম্বরে সেন্ড মানি করুন এবং ট্রানজ্যাকশন আইডি নিচে প্রদান করুন।
                    </span>

                    {/* bKash details when selected */}
                    {paymentMethod === 'bkash' && (
                      <div className="mt-4 p-4 rounded-xl bg-white border border-pink-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between bg-pink-50 p-2.5 rounded-lg">
                          <span className="font-semibold text-slate-700">বিকাশ নম্বর:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-pink-700 text-sm select-all num-bn">
                              {settings?.bkashNumber || '01711234567'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(settings?.bkashNumber || '01711234567');
                                showToast('বিকাশ নম্বর কপি করা হয়েছে!', 'success');
                              }}
                              className="px-2 py-0.5 bg-white text-pink-700 rounded text-[10px] font-bold border border-pink-200 cursor-pointer shadow-xs hover:bg-pink-100 active:scale-95"
                            >
                              কপি
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          ১. আপনার বিকাশ অ্যাপ থেকে উপরের নম্বরে <strong className="num-bn">৳{grandTotal.toLocaleString('bn-BD')}</strong> সেন্ড মানি করুন।<br />
                          ২. ফিরতি মেসেজের ট্রানজ্যাকশন আইডি (TrxID) নিচে লিখুন।
                        </p>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            বিকাশ ট্রানজ্যাকশন আইডি (TrxID) <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={e => setTransactionId(e.target.value)}
                            placeholder="যেমন: 9J3K8X2P"
                            className="w-full clay-inset px-3 py-2 text-slate-800 uppercase text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            যে নম্বর থেকে টাকা পাঠিয়েছেন (ঐচ্ছিক)
                          </label>
                          <input
                            type="tel"
                            value={senderPhone}
                            onChange={e => setSenderPhone(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full clay-inset px-3 py-2 text-slate-800 text-xs num-bn"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* Nagad */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'nagad'
                      ? 'border-orange-600 bg-orange-50/40 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="nagad"
                    checked={paymentMethod === 'nagad'}
                    onChange={() => setPaymentMethod('nagad')}
                    className="mt-1 text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-orange-700">
                        নগদ পেমেন্ট (Nagad)
                      </span>
                      <span className="text-[11px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                        {settings?.nagadType || 'Personal'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      আমাদের নগদ নম্বরে সেন্ড মানি করুন এবং ট্রানজ্যাকশন আইডি নিচে প্রদান করুন।
                    </span>

                    {/* Nagad details when selected */}
                    {paymentMethod === 'nagad' && (
                      <div className="mt-4 p-4 rounded-xl bg-white border border-orange-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between bg-orange-50 p-2.5 rounded-lg">
                          <span className="font-semibold text-slate-700">নগদ নম্বর:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-orange-700 text-sm select-all num-bn">
                              {settings?.nagadNumber || '01711234567'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(settings?.nagadNumber || '01711234567');
                                showToast('নগদ নম্বর কপি করা হয়েছে!', 'success');
                              }}
                              className="px-2 py-0.5 bg-white text-orange-700 rounded text-[10px] font-bold border border-orange-200 cursor-pointer shadow-xs hover:bg-orange-100 active:scale-95"
                            >
                              কপি
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          ১. আপনার নগদ অ্যাপ বা ডায়াল করে উপরের নম্বরে <strong className="num-bn">৳{grandTotal.toLocaleString('bn-BD')}</strong> সেন্ড মানি করুন।<br />
                          ২. ফিরতি মেসেজের ট্রানজ্যাকশন আইডি (TrxID) নিচে লিখুন।
                        </p>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            নগদ ট্রানজ্যাকশন আইডি (TrxID) <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={e => setTransactionId(e.target.value)}
                            placeholder="যেমন: 7H8B3L1M"
                            className="w-full clay-inset px-3 py-2 text-slate-800 uppercase text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            যে নম্বর থেকে টাকা পাঠিয়েছেন (ঐচ্ছিক)
                          </label>
                          <input
                            type="tel"
                            value={senderPhone}
                            onChange={e => setSenderPhone(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full clay-inset px-3 py-2 text-slate-800 text-xs num-bn"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Order Summary Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Products overview card */}
            <div className="clay-card p-6 bg-white space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                অর্ডারের আইটেম সমূহ ({cart.length})
              </h3>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const price = item.product.salePrice ?? item.product.regularPrice;
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                          <img
                            src={getProductImageUrl(item.product.mainImage || item.product.images?.[0])}
                            alt={item.product.name}
                            className="max-h-full max-w-full object-contain"
                            onError={handleImageError}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 line-clamp-1">
                            {item.product.name}
                          </h4>
                          <span className="text-slate-400 num-bn">
                            পরিমাণ: {item.quantity} টি × ৳{price.toLocaleString('bn-BD')}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 num-bn shrink-0">
                        ৳{(price * item.quantity).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Coupon input */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={e => setCouponCodeInput(e.target.value)}
                    placeholder="কুপন কোড (যেমন: ZX10)"
                    disabled={appliedCoupon !== null}
                    className="flex-1 clay-inset px-3 py-2 text-xs uppercase text-slate-800 focus:outline-none"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCodeInput('');
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      বাতিল
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCodeInput.trim()}
                      className="clay-btn-secondary px-3.5 py-2 text-xs font-bold shrink-0 text-rose-600 disabled:opacity-50"
                    >
                      {isApplyingCoupon ? '...' : 'প্রয়োগ'}
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>কুপন কোড "{appliedCoupon.code}" প্রয়োগ হয়েছে (-৳{appliedCoupon.discount})</span>
                  </p>
                )}
              </div>

              {/* Price Calculations */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>পণ্যের মূল্য:</span>
                  <span className="font-bold text-slate-900 num-bn">
                    ৳{cartSubtotal.toLocaleString('bn-BD')}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>কুপন ছাড়:</span>
                    <span className="num-bn">-৳{discount.toLocaleString('bn-BD')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>ডেলিভারি চার্জ ({selectedZone?.name}):</span>
                  <span className={`font-bold num-bn ${deliveryCharge === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {deliveryCharge === 0 ? 'ফ্রি' : `৳${deliveryCharge.toLocaleString('bn-BD')}`}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base font-black text-slate-900">
                  <span>সর্বমোট প্রদেয় টাকা:</span>
                  <span className="text-rose-600 text-xl sm:text-2xl num-bn">
                    ৳{grandTotal.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full clay-btn-primary py-4 px-4 text-base font-black flex items-center justify-center gap-2 shadow-xl ${
                  isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <span>অর্ডার প্রসেস হচ্ছে...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>অর্ডার নিশ্চিত করুন (৳{grandTotal.toLocaleString('bn-BD')})</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>আপনার দেওয়া তথ্য সম্পূর্ণ সুরক্ষিত এবং এনক্রিপ্টেড</span>
              </div>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
};
