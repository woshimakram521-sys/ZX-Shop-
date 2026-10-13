import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types/ecommerce';
import { Search, Filter, RotateCcw, ArrowUpDown } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const {
    categories,
    selectedCategorySlug,
    setSelectedCategorySlug,
    searchQuery,
    setSearchQuery,
  } = useShop();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategorySlug && selectedCategorySlug !== 'all') {
        params.append('category', selectedCategorySlug);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (minPrice) {
        params.append('minPrice', minPrice);
      }
      if (maxPrice) {
        params.append('maxPrice', maxPrice);
      }
      if (sortOption) {
        params.append('sort', sortOption);
      }
      params.append('page', page.toString());
      params.append('limit', '12');

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategorySlug, searchQuery, minPrice, maxPrice, sortOption, page]);

  const handleResetFilters = () => {
    setSelectedCategorySlug(null);
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSortOption('newest');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
          সকল পণ্য কালেকশন
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
          মোট <span className="font-bold text-rose-600 num-bn">{totalCount}</span> টি পণ্য পাওয়া গেছে
        </p>
      </div>

      {/* Category Pills & Filters */}
      <div className="clay-card-flat p-3.5 sm:p-5 bg-white space-y-3.5">
        {/* Category Horizontal Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              setPage(1);
            }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              !selectedCategorySlug
                ? 'clay-btn-primary shadow-sm'
                : 'clay-btn-secondary text-slate-700 hover:text-rose-600'
            }`}
          >
            সব ক্যাটাগরি
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCategorySlug(c.slug);
                setPage(1);
              }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                selectedCategorySlug === c.slug
                  ? 'clay-btn-primary shadow-sm'
                  : 'clay-btn-secondary text-slate-700 hover:text-rose-600'
              }`}
            >
              {c.banglaName}
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {/* Search in products */}
          <div className="clay-inset px-3 py-1.5 flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="পণ্যের নাম দিয়ে খুঁজুন..."
              className="bg-transparent w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Min Price */}
          <div className="clay-inset px-3 py-1.5 flex items-center">
            <span className="text-[11px] text-slate-500 mr-2 shrink-0">সর্বনিম্ন ৳</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPage(1);
              }}
              placeholder="০"
              className="bg-transparent w-full text-xs text-slate-800 focus:outline-none num-bn"
            />
          </div>

          {/* Max Price */}
          <div className="clay-inset px-3 py-1.5 flex items-center">
            <span className="text-[11px] text-slate-500 mr-2 shrink-0">সর্বোচ্চ ৳</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
              placeholder="১০,০০০"
              className="bg-transparent w-full text-xs text-slate-800 focus:outline-none num-bn"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="clay-inset px-3 py-1.5 flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPage(1);
              }}
              className="bg-transparent w-full text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="newest">নতুন পণ্য আগে</option>
              <option value="price_asc">দাম: কম থেকে বেশি</option>
              <option value="price_desc">দাম: বেশি থেকে কম</option>
              <option value="popular">জনপ্রিয় পণ্য</option>
            </select>
          </div>
        </div>

        {/* Active Filters Clear Button */}
        {(selectedCategorySlug || searchQuery || minPrice || maxPrice || sortOption !== 'newest') && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500 text-[11px]">ফিল্টার সক্রিয় রয়েছে</span>
            <button
              onClick={handleResetFilters}
              className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ফিল্টার রিসেট করুন</span>
            </button>
          </div>
        )}
      </div>

      {/* Product List Content (2-column on mobile, 4-column on desktop) */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="clay-card p-3 animate-pulse space-y-2.5">
              <div className="w-full aspect-square bg-slate-200 rounded-xl" />
              <div className="h-3.5 bg-slate-200 rounded w-3/4" />
              <div className="h-3.5 bg-slate-200 rounded w-1/2" />
              <div className="h-7 bg-slate-200 rounded w-full mt-2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="clay-card p-8 sm:p-12 text-center max-w-lg mx-auto bg-white">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">
            কোনো পণ্য পাওয়া যায়নি!
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            আপনার অনুসন্ধানের সাথে মিল রেখে কোনো পণ্য খুঁজে পাওয়া যায়নি। ফিল্টার রিসেট করে আবার চেষ্টা করুন।
          </p>
          <button
            onClick={handleResetFilters}
            className="clay-btn-primary px-5 py-2 text-xs font-bold cursor-pointer"
          >
            সব পণ্য আবার দেখুন
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => {
                  setPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`clay-btn-secondary px-3.5 py-1.5 text-xs font-bold ${
                  page <= 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                পূর্ববর্তী
              </button>

              <span className="px-3 py-1.5 text-xs font-bold text-slate-700 num-bn">
                পৃষ্ঠা {page} / {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => {
                  setPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`clay-btn-secondary px-3.5 py-1.5 text-xs font-bold ${
                  page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                পরবর্তী
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
