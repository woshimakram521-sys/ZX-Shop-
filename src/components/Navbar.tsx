import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { ShoppingBag, Search, Phone, Truck, Menu, X, ArrowRight, User, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    cartCount,
    settings,
    searchQuery,
    setSearchQuery,
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentView('products');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#f2f5fa]/95 backdrop-blur-md border-b border-white/80 shadow-[0_4px_16px_rgba(160,175,205,0.12)]">
      {/* Top Notification Announcement Bar */}
      {settings?.announcementNotice && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 text-white text-xs py-1.5 px-4 text-center font-bold tracking-wide flex items-center justify-center gap-2 shadow-inner">
          <Truck className="w-3.5 h-3.5 shrink-0 animate-bounce" />
          <span className="truncate">{settings.announcementNotice}</span>
        </div>
      )}

      {/* Main Navigation - 3-Zone Contract */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-8 h-18 sm:h-20">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center min-w-0 shrink">
            <button
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none cursor-pointer select-none"
              aria-label="ZX Shop Home"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-black text-base sm:text-xl shadow-[3px_3px_10px_rgba(225,29,72,0.35),-1px_-1px_4px_rgba(255,255,255,0.9)] group-hover:scale-105 active:scale-95 transition-transform border border-white/40 shrink-0">
                ZX
              </div>
              <div className="min-w-0">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 block leading-tight font-['Plus_Jakarta_Sans']">
                  {(settings?.storeName || 'ZX Shop').replace(/\bUpdated\b/gi, '').trim() || 'ZX Shop'}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold sm:font-bold text-rose-600 tracking-tight block leading-tight mt-0.5 whitespace-nowrap">
                  {settings?.storeTagline || 'আপনার পছন্দের অনলাইন শপ'}
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar (Center in desktop/tablet) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-2 relative items-center"
          >
            <div className="w-full clay-inset flex items-center px-3.5 py-2 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="পণ্য, ক্যাটাগরি বা ব্র্যান্ড খুঁজুন..."
                className="bg-transparent w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="ml-2 px-4 py-2 clay-btn-primary text-xs font-bold shrink-0 cursor-pointer"
            >
              খুঁজুন
            </button>
          </form>

          {/* Zone 2: Primary Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-bold text-slate-700">
            <button
              onClick={() => setCurrentView('home')}
              className={`hover:text-rose-600 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                currentView === 'home' ? 'text-rose-600 border-rose-600' : 'border-transparent'
              }`}
            >
              হোম
            </button>
            <button
              onClick={() => setCurrentView('products')}
              className={`hover:text-rose-600 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                currentView === 'products' ? 'text-rose-600 border-rose-600' : 'border-transparent'
              }`}
            >
              সকল পণ্য
            </button>
            <button
              onClick={() => setCurrentView('track')}
              className={`hover:text-rose-600 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                currentView === 'track' ? 'text-rose-600 border-rose-600' : 'border-transparent'
              }`}
            >
              অর্ডার ট্র্যাক
            </button>
            <button
              onClick={() => setCurrentView('contact')}
              className={`hover:text-rose-600 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                currentView === 'contact' ? 'text-rose-600 border-rose-600' : 'border-transparent'
              }`}
            >
              যোগাযোগ
            </button>
          </nav>

          {/* Zone 3: Interactive Action Zone */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Cart Button with tactile depth */}
            <button
              onClick={() => setCurrentView('cart')}
              className="clay-btn-primary px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold relative transition-all cursor-pointer"
              aria-label="শপিং কার্ট"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-rose-600 text-[10px] font-black rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shadow-md">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">কার্ট</span>
            </button>

            {/* Admin Access Button */}
            <button
              onClick={() => setCurrentView('admin')}
              className="clay-btn-secondary p-2 sm:px-3.5 sm:py-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-rose-600 cursor-pointer"
              title="অ্যাডমিন প্যানেল"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">অ্যাডমিন</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden clay-btn-secondary p-2 text-slate-700 cursor-pointer"
              aria-label="মেনু খুলুন"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden pb-2.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="flex-1 clay-inset flex items-center px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="bg-transparent w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="clay-btn-primary px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer"
            >
              সার্চ
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-xl border-b border-slate-200 px-5 py-4 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-2.5 font-bold text-slate-800 text-sm">
            <button
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 hover:text-rose-600 flex items-center justify-between"
            >
              <span>হোম পেজ</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => {
                setCurrentView('products');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 hover:text-rose-600 flex items-center justify-between"
            >
              <span>সকল পণ্য কালেকশন</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => {
                setCurrentView('track');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 hover:text-rose-600 flex items-center justify-between"
            >
              <span>অর্ডার ট্র্যাকিং</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => {
                setCurrentView('contact');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 hover:text-rose-600 flex items-center justify-between"
            >
              <span>যোগাযোগ ও সহায়তা</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => {
                setCurrentView('faq');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 hover:text-rose-600 flex items-center justify-between"
            >
              <span>সাধারণ প্রশ্নোত্তর (FAQ)</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => {
                setCurrentView('policies');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 hover:text-rose-600 flex items-center justify-between"
            >
              <span>রিটার্ন ও শর্তাবলি</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">জরুরি কাস্টমার সাপোর্ট:</span>
              <a
                href={`tel:${settings?.contactPhone}`}
                className="text-xs font-bold text-rose-600 flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                {settings?.contactPhone}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
