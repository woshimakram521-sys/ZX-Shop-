import React from 'react';
import { useShop } from '../context/ShopContext';
import { Phone, Mail, MapPin, MessageCircle, ShieldCheck, Truck, RefreshCw, CreditCard } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, setCurrentView, categories, navigateToCategory } = useShop();

  return (
    <footer className="mt-20 border-t border-slate-200/80 bg-white/70 backdrop-blur-md">
      {/* Trust Badges Strip */}
      <div className="border-b border-slate-200/60 py-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">সারা দেশে দ্রুত ডেলিভারি</h4>
              <p className="text-xs text-slate-500 mt-1">ঢাকা ও দেশের প্রতিটি প্রান্তে হোম ডেলিভারি</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">১০০% অথেনটিক পণ্য</h4>
              <p className="text-xs text-slate-500 mt-1">কোয়ালিটি যাচাইকৃত আসল পণ্য সরাসরি আপনার হাতে</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">ক্যাশ অন ডেলিভারি</h4>
              <p className="text-xs text-slate-500 mt-1">পণ্য হাতে পেয়ে নিশ্চিন্তে টাকা পরিশোধের সুযোগ</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 shadow-inner">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">সহজ রিটার্ন সুবিধা</h4>
              <p className="text-xs text-slate-500 mt-1">পণ্য ত্রুটিপূর্ণ হলে ৩ দিনের মধ্যে সহজ এক্সচেঞ্জ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Bio */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                ZX
              </div>
              <span className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
                {settings?.storeName || 'ZX Shop'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {settings?.aboutStory ? settings.aboutStory.slice(0, 150) + '...' : 'ZX Shop - বিশ্বস্ত ও আধুনিক অনলাইন শপিং প্ল্যাটফর্ম। আপনার পছন্দের পণ্য সাশ্রয়ী মূল্যে ঘরে বসে পেতে অর্ডার করুন।'}
            </p>
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-700 mb-1">পেমেন্ট মেথড:</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                  Cash on Delivery
                </span>
                <span className="px-2.5 py-1 bg-pink-50 border border-pink-200 rounded-lg text-xs font-bold text-pink-700 shadow-sm">
                  bKash
                </span>
                <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-lg text-xs font-bold text-orange-700 shadow-sm">
                  Nagad
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              পণ্য ক্যাটাগরি
            </h3>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              {categories.slice(0, 6).map(c => (
                <li key={c.id}>
                  <button
                    onClick={() => navigateToCategory(c.slug)}
                    className="hover:text-rose-600 transition-colors text-left"
                  >
                    {c.banglaName}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Useful Links */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              প্রয়োজনীয় লিংক
            </h3>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>
                <button
                  onClick={() => setCurrentView('track')}
                  className="hover:text-rose-600 transition-colors"
                >
                  অর্ডার ট্র্যাকিং
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('about')}
                  className="hover:text-rose-600 transition-colors"
                >
                  আমাদের সম্পর্কে
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('faq')}
                  className="hover:text-rose-600 transition-colors"
                >
                  সাধারণ প্রশ্নোত্তর (FAQ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('policies')}
                  className="hover:text-rose-600 transition-colors"
                >
                  রিটার্ন ও রিফান্ড পলিসি
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('policies')}
                  className="hover:text-rose-600 transition-colors"
                >
                  প্রাইভেসি পলিসি ও শর্তাবলি
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('admin')}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  অ্যাডমিন প্রবেশ
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Help */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              যোগাযোগ ও সহায়তা
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{settings?.address || 'ধানমন্ডি, ঢাকা, বাংলাদেশ'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-rose-600 shrink-0" />
                <a href={`tel:${settings?.contactPhone}`} className="hover:underline font-semibold text-slate-800">
                  {settings?.contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{settings?.email || 'support@zxshop.com.bd'}</span>
              </div>
              
              {/* WhatsApp direct button */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/${(settings?.whatsappNumber || '01711234567').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp-এ সরাসরি কথা বলুন</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} {settings?.storeName || 'ZX Shop'}। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="text-slate-400">মেড ফর বাংলাদেশ 🇧🇩</p>
        </div>
      </div>
    </footer>
  );
};
