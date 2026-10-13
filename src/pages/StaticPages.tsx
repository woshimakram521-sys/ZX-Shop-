import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Phone, Mail, MapPin, MessageCircle, Clock, ShieldCheck, HelpCircle, FileText, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { settings, showToast } = useShop();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !msg.trim()) {
      showToast('সবগুলো ঘর পূরণ করুন।', 'error');
      return;
    }
    setSent(true);
    showToast('আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center max-w-lg mx-auto">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          যোগাযোগ ও কাস্টমার সাপোর্ট
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          যেকোনো তথ্য, অর্ডার সংক্রান্ত প্রশ্ন বা পরামর্শে আমরা সবসময় আপনার পাশে আছি
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="clay-card p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              আমাদের সরাসরি যোগাযোগের মাধ্যম
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900">দোকানের ঠিকানা:</strong>
                  <span>{settings?.address || 'বাড়ি #১২, রোড #০৫, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900">হটলাইন নম্বর:</strong>
                  <a href={`tel:${settings?.contactPhone}`} className="hover:underline font-bold text-rose-600">
                    {settings?.contactPhone || '+880 1711-234567'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900">ইমেইল:</strong>
                  <span>{settings?.email || 'support@zxshop.com.bd'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900">সেবার সময়সূচী:</strong>
                  <span>প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="pt-4 border-t border-slate-100">
              <a
                href={`https://wa.me/${(settings?.whatsappNumber || '01711234567').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full clay-btn-mint py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>WhatsApp-এ সরাসরি চ্যাট করুন</span>
              </a>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="clay-card p-6 sm:p-8 bg-white">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
            আমাদের একটি বার্তা পাঠান
          </h3>

          {sent ? (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-emerald-900">বার্তাটি পৌঁছেছে!</h4>
              <p className="text-xs text-emerald-700">ধন্যবাদ, আমরা দ্রুত আপনার সাথে যোগাযোগ করব।</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">আপনার নাম:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="যেমন: আরমান হোসেন"
                  className="w-full clay-inset px-3.5 py-2.5 text-slate-800 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর:</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full clay-inset px-3.5 py-2.5 text-slate-800 text-xs focus:outline-none num-bn"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">আপনার বার্তা বা অনুসন্ধান:</label>
                <textarea
                  required
                  rows={4}
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  placeholder="কী বিষয়ে জানতে চান বিস্তারিত লিখুন..."
                  className="w-full clay-inset px-3.5 py-2.5 text-slate-800 text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full clay-btn-primary py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>বার্তা পাঠান</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const AboutPage: React.FC = () => {
  const { settings, setCurrentView } = useShop();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-lg mx-auto">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          আমাদের সম্পর্কে (About ZX Shop)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {settings?.storeTagline || 'আপনার বিশ্বস্ত অনলাইন শপিং গন্তব্য'}
        </p>
      </div>

      <div className="clay-card p-6 sm:p-10 bg-white space-y-6 text-sm text-slate-700 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
          আমাদের যাত্রা ও অঙ্গীকার
        </h2>
        
        <p>
          {settings?.aboutStory ||
            'ZX Shop বাংলাদেশের একটি আধুনিক, নিরাপদ এবং মাল্টি-ক্যাটাগরি ই-কমার্স প্ল্যাটফর্ম। আমাদের মূল লক্ষ্য হল সারা দেশের ক্রেতাদের কাছে সেরা মানের প্রডাক্ট সঠিক দামে এবং সবচেয়ে দ্রুততম সময়ে পৌঁছে দেওয়া।'}
        </p>

        <p>
          আমরা বিশ্বাস করি অনলাইন কেনাকাটা হওয়া উচিত সম্পূর্ণ ঝামেলামুক্ত। এজন্য আমরা ক্যাশ অন ডেলিভারি সুবিধা প্রদান করি, যাতে ক্রেতারা পণ্য হাতে পেয়ে দেখেশুনে মূল্য পরিশোধ করতে পারেন।
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <h4 className="text-2xl font-black text-rose-600 num-bn">১০০%</h4>
            <p className="text-xs font-bold text-slate-700 mt-1">আসল পণ্য গ্যারান্টি</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <h4 className="text-2xl font-black text-emerald-600 num-bn">৬৪ জেলা</h4>
            <p className="text-xs font-bold text-slate-700 mt-1">হোম ডেলিভারি কভারেজ</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <h4 className="text-2xl font-black text-blue-600 num-bn">২৪/৭</h4>
            <p className="text-xs font-bold text-slate-700 mt-1">কাস্টমার সহায়তা</p>
          </div>
        </div>

        <div className="pt-6 text-center">
          <button
            onClick={() => setCurrentView('products')}
            className="clay-btn-primary px-8 py-3 text-xs sm:text-sm font-bold"
          >
            কালেকশন ঘুরে দেখুন
          </button>
        </div>
      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => {
  const faqs = [
    {
      q: 'আমি কীভাবে ZX Shop থেকে অর্ডার করব?',
      a: 'পছন্দের পণ্যটি সিলেক্ট করে "কার্টে যোগ করুন" অথবা "এখনই অর্ডার করুন" এ ক্লিক করুন। এরপর নাম, ঠিকানা ও মোবাইল নম্বর দিয়ে ক্যাশ অন ডেলিভারি বা বিকাশ/নগদ নির্বাচন করে অর্ডার কনফার্ম করুন। কোনো অ্যাকাউন্ট খোলার প্রয়োজন নেই।',
    },
    {
      q: 'ডেলিভারি চার্জ কত এবং কতদিন সময় লাগে?',
      a: 'ঢাকা সিটির ভেতরে ডেলিভারি চার্জ সাধারণত ৳৬০ (১-২ দিন) এবং ঢাকার বাইরে ৳১৩০ (৩-৫ দিন)। এছাড়া ৩০০০ টাকার বেশি অর্ডারে সমগ্র বাংলাদেশে সম্পূর্ণ ফ্রি ডেলিভারি!',
    },
    {
      q: 'ক্যাশ অন ডেলিভারিতে কীভাবে পেমেন্ট করব?',
      a: 'ডেলিভারি বয় আপনার ঠিকানায় পার্সেল নিয়ে গেলে আপনি পণ্যটি চেক করে তার কাছে নগদ মূল্য পরিশোধ করবেন।',
    },
    {
      q: 'বিকাশ বা নগদে কীভাবে পরিশোধ করব?',
      a: 'চেকআউট পেজে উল্লেখিত আমাদের বিকাশ/নগদ নম্বরে মোট বিল সেন্ড মানি করে প্রাপ্ত TrxID (Transaction ID) ফর্মের নির্ধারিত বক্সে বসিয়ে অর্ডার সম্পন্ন করবেন।',
    },
    {
      q: 'পণ্য পছন্দ না হলে বা ত্রুটি থাকলে পরিবর্তনের নিয়ম কী?',
      a: 'পণ্য হাতে পাওয়ার ৩ দিনের মধ্যে কোনো সমস্যা বা ডিফেক্ট দেখা দিলে অক্ষত প্যাকেজিংসহ আমাদের WhatsApp বা হটলাইনে জানালে আমরা তাৎক্ষণিকভাবে বিনামূল্যে এক্সচেঞ্জ করে দেব।',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-lg mx-auto">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          সাধারণ জিজ্ঞাসা (FAQ)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          অর্ডার, পেমেন্ট ও ডেলিভারি সংক্রান্ত প্রচলিত প্রশ্নাবলি
        </p>
      </div>

      <div className="clay-card p-6 sm:p-8 bg-white space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{f.q}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 pl-6 leading-relaxed">
              {f.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PoliciesPage: React.FC = () => {
  const { settings } = useShop();
  const [tab, setTab] = useState<'return' | 'privacy' | 'terms'>('return');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-lg mx-auto">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          ওয়েবসাইট নীতিমালা
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          রিটার্ন পলিসি, প্রাইভেসী এবং সেবার শর্তাবলি
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setTab('return')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tab === 'return' ? 'clay-btn-primary' : 'clay-btn-secondary text-slate-700'
          }`}
        >
          রিটার্ন ও এক্সচেঞ্জ পলিসি
        </button>
        <button
          onClick={() => setTab('privacy')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tab === 'privacy' ? 'clay-btn-primary' : 'clay-btn-secondary text-slate-700'
          }`}
        >
          প্রাইভেসি পলিসি
        </button>
        <button
          onClick={() => setTab('terms')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tab === 'terms' ? 'clay-btn-primary' : 'clay-btn-secondary text-slate-700'
          }`}
        >
          ব্যবহারের শর্তাবলি
        </button>
      </div>

      <div className="clay-card p-6 sm:p-10 bg-white text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
        {tab === 'return' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              রিটার্ন ও রিফান্ড নীতিমালা
            </h2>
            {settings?.returnPolicy ||
              '১. পণ্য ডেলিভারির সময় ডেলিভারি এজেন্টের উপস্থিতিতে পণ্যটি দেখে নিশ্চিত হন।\n২. পণ্য ক্ষতিগ্রস্ত, ভাঙা অথবা ত্রুটিপূর্ণ হলে তাৎক্ষণিকভাবে আমাদের হটলাইনে জানান।\n৩. ডেলিভারির ৩ দিনের মধ্যে জেনুইন সমস্যার ক্ষেত্রে অক্ষত প্যাকেজিংসহ পরিবর্তনের অনুরোধ করা যাবে।'}
          </div>
        )}

        {tab === 'privacy' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              প্রাইভেসি ও তথ্য সুরক্ষা পলিসি
            </h2>
            {settings?.privacyPolicy ||
              'আমরা আপনার নাম, ফোন নম্বর ও ঠিকানার সর্বোচ্চ গোপনীয়তা রক্ষা করি। আপনার কোনো ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি বা অপব্যবহার করা হয় না। এটি শুধুমাত্র ডেলিভারি সম্পন্ন করার জন্য ব্যবহার করা হয়।'}
          </div>
        )}

        {tab === 'terms' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              সেবার নিয়ম ও শর্তাবলি
            </h2>
            {settings?.termsConditions ||
              '১. ZX Shop থেকে পণ্য অর্ডার করার মাধ্যমে আপনি আমাদের নিয়মাবলিতে সম্মত হচ্ছেন।\n২. মূল্য ও স্টকের তথ্য যে কোনো সময় পরিবর্তিত হতে পারে।\n৩. অনাকাঙ্ক্ষিত কোনো কারিগরি ভুলের জন্য কোনো অর্ডার গ্রহণ বা বাতিল করার অধিকার কর্তৃপক্ষ সংরক্ষণ করে।'}
          </div>
        )}
      </div>
    </div>
  );
};
