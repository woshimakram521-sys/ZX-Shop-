import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { DatabaseSchema, Product, Category, Order, DeliveryZone, Coupon, Review, StoreSettings } from '../src/types/ecommerce.ts';

const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

const defaultCategories: Category[] = [
  { id: 'cat-1', slug: 'fashion-clothing', name: 'পোশাক ও ফ্যাশন', banglaName: 'পোশাক ও ফ্যাশন', icon: 'Shirt', isPublished: true, order: 1 },
  { id: 'cat-2', slug: 'cosmetics-skincare', name: 'কসমেটিকস ও স্কিনকেয়ার', banglaName: 'কসমেটিকস ও স্কিনকেয়ার', icon: 'Sparkles', isPublished: true, order: 2 },
  { id: 'cat-3', slug: 'electronics-gadgets', name: 'ইলেকট্রনিকস ও গ্যাজেট', banglaName: 'ইলেকট্রনিকস ও গ্যাজেট', icon: 'Smartphone', isPublished: true, order: 3 },
  { id: 'cat-4', slug: 'home-kitchen', name: 'হোম ও কিচেন', banglaName: 'হোম ও কিচেন', icon: 'Home', isPublished: true, order: 4 },
  { id: 'cat-5', slug: 'watches-accessories', name: 'ঘড়ি ও অ্যাকসেসরিজ', banglaName: 'ঘড়ি ও অ্যাকসেসরিজ', icon: 'Watch', isPublished: true, order: 5 },
  { id: 'cat-6', slug: 'baby-kids', name: 'বেবি ও কিডস', banglaName: 'বেবি ও কিডস', icon: 'Baby', isPublished: true, order: 6 },
  { id: 'cat-7', slug: 'sports-fitness', name: 'স্পোর্টস ও ফিটনেস', banglaName: 'স্পোর্টস ও ফিটনেস', icon: 'Dumbbell', isPublished: true, order: 7 },
  { id: 'cat-8', slug: 'stationery-others', name: 'স্টেশনারি ও অন্যান্য', banglaName: 'স্টেশনারি ও অন্যান্য', icon: 'BookOpen', isPublished: true, order: 8 },
];

const defaultDeliveryZones: DeliveryZone[] = [
  { id: 'zone-1', name: 'ঢাকা সিটির ভিতরে', rate: 60, estimatedDays: '১–২ দিন', isActive: true },
  { id: 'zone-2', name: 'ঢাকা সাব-এরিয়া (গাজীপুর/সাভার/কেরানীগঞ্জ)', rate: 100, estimatedDays: '২–৩ দিন', isActive: true },
  { id: 'zone-3', name: 'ঢাকার বাইরে (সমগ্র বাংলাদেশ)', rate: 130, estimatedDays: '৩–৫ দিন', isActive: true },
];

const defaultCoupons: Coupon[] = [
  { code: 'ZX10', discountType: 'percentage', discountValue: 10, minOrderAmount: 1000, isActive: true },
  { code: 'WELCOME50', discountType: 'fixed', discountValue: 50, minOrderAmount: 500, isActive: true },
  { code: 'FREE60', discountType: 'fixed', discountValue: 60, minOrderAmount: 2000, isActive: true },
];

const defaultSettings: StoreSettings = {
  storeName: 'ZX Shop',
  storeTagline: 'আপনার পছন্দের অনলাইন শপ',
  logoUrl: '',
  contactPhone: '+880 1711-234567',
  whatsappNumber: '+880 1711-234567',
  email: 'support@zxshop.com.bd',
  address: 'বাড়ি #১২, রোড #০৫, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ',
  bkashNumber: '01711234567',
  bkashType: 'Personal',
  nagadNumber: '01711234567',
  nagadType: 'Personal',
  freeDeliveryThreshold: 3000,
  announcementNotice: '🎉 সমগ্র বাংলাদেশে হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা! ৩০০০ টাকার অর্ডারে ফ্রি ডেলিভারি!',
  bannerTitle: 'আধুনিক লাইফস্টাইল ও প্রিমিয়াম প্রডাক্ট কালেকশন',
  bannerSubtitle: '১০০% খাঁটি পণ্য, দ্রুততম ডেলিভারি এবং সহজ রিটার্ন সুবিধা নিয়ে ZX Shop রয়েছে আপনার পাশে।',
  bannerImage: '/src/assets/images/hero_ecommerce_banner_1791605905466.jpg',
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  aboutStory: 'ZX Shop বাংলাদেশের একটি বিশ্বস্ত ও আধুনিক অনলাইন শপ। আমরা গ্রাহকদের জন্য সেরা মানের লাইফস্টাইল, ফ্যাশন, কসমেটিকস ও গ্যাজেট পণ্য সরাসরি সঠিক মূল্যে সরবরাহ করি। আমাদের মূল লক্ষ্য হল শতভাগ কাস্টমার সন্তুষ্টি এবং নির্ভেজাল শপিং অভিজ্ঞতা প্রদান করা।',
  privacyPolicy: 'আমরা আপনার ব্যক্তিগত তথ্যের সর্বোচ্চ গোপনীয়তা রক্ষা করি। অর্ডার প্রক্রিয়াকরণ ও ডেলিভারি ব্যতীত কোনো তৃতীয় পক্ষের কাছে আপনার ডেটা প্রকাশ করা হয় না।',
  termsConditions: 'পণ্য গ্রহণের সময় ডেলিভারি এজেন্টের সামনে ভালো করে দেখে গ্রহণ করুন। কোনো প্রকার ত্রুটি বা সমস্যা থাকলে তাৎক্ষণিকভাবে কাস্টমার কেয়ারে যোগাযোগ করার অনুরোধ করা যাচ্ছে।',
  returnPolicy: 'পণ্য ডেলিভারির ৩ দিনের মধ্যে কোনো সমস্যা থাকলে অক্ষত প্যাকেজিংসহ পরিবর্তনের অনুরোধ করতে পারেন। জেনুইন সমস্যার ক্ষেত্রে বিনা খরচে পরিবর্তন করা হবে।',
  metaTitle: 'ZX Shop – আধুনিক ও সম্পূর্ণ বাংলা অনলাইন শপ',
  metaDescription: 'বাংলাদেশের সেরা ই-কমার্স প্ল্যাটফর্ম ZX Shop। পোশাক, কসমেটিকস, ইলেকট্রনিক্স ও গ্যাজেট ঘরে বসে অর্ডার করুন। ক্যাশ অন ডেলিভারি সহজলভ্য।',
};

const defaultProducts: Product[] = [
  {
    id: 'prod-1',
    slug: 'matte-black-smartwatch-ultra',
    sku: 'ZX-SW-01',
    name: 'ম্যাট ব্ল্যাক প্রিমিয়াম স্মার্টওয়াচ আল্ট্রা (AMOLED ডিসপ্লে)',
    category: 'cat-3',
    description: 'উচ্চমানের এমোলেড কার্ভড ডিসপ্লে, হার্টরেট মনিটর, স্লিপ ট্র্যাকিং, ব্লুটুথ কলিং এবং ওয়াটারপ্রুফ বডি। ফুল চার্জে একটানা ৭ দিন পর্যন্ত ব্যাটারি ব্যাকআপ। স্টাইলিশ কালো সিলিকন বেল্ট সহ সম্পূর্ণ বক্স প্যাক।',
    regularPrice: 2800,
    salePrice: 2190,
    stock: 25,
    images: ['/src/assets/images/product_smartwatch_black_1791605919110.jpg'],
    mainImage: '/src/assets/images/product_smartwatch_black_1791605919110.jpg',
    variants: [
      { id: 'v1', name: 'রং', options: ['ম্যাট ব্ল্যাক', 'স্পেস গ্রে'] }
    ],
    isFeatured: true,
    isPopular: true,
    isPublished: true,
    rating: 4.9,
    reviewCount: 38,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    slug: 'royal-navy-cotton-panjabi',
    sku: 'ZX-FSH-02',
    name: 'রয়্যাল নেভি ব্লু এক্সক্লুসিভ কটন সেমি-লং পাঞ্জাবি',
    category: 'cat-1',
    description: '১০০% পিওর প্রিমিয়াম কটন কাপড়ে প্রস্তুতকৃত মার্জিত ডিজাইনের পাঞ্জাবি। কলার ও প্লেকেটে নিখুঁত সুতার এমব্রয়ডারি কাজ। উৎসব কিংবা সাধারণ ব্যবহারের জন্য অত্যন্ত আরামদায়ক ও আভিজাত্যপূর্ণ।',
    regularPrice: 2200,
    salePrice: 1750,
    stock: 40,
    images: ['/src/assets/images/product_panjabi_fashion_1791605930821.jpg'],
    mainImage: '/src/assets/images/product_panjabi_fashion_1791605930821.jpg',
    variants: [
      { id: 'v1', name: 'সাইজ', options: ['M (40)', 'L (42)', 'XL (44)', 'XXL (46)'] }
    ],
    isFeatured: true,
    isPopular: true,
    isPublished: true,
    rating: 4.8,
    reviewCount: 52,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    slug: 'aura-botanicals-radiance-serum',
    sku: 'ZX-COS-03',
    name: 'অরা বোটানিক্যালস ন্যাচারাল গ্লো রেডিয়েন্স সিরাম (30ml)',
    category: 'cat-2',
    description: 'ভিটামিন সি ও হায়ালুরোনিক অ্যাসিড সমৃদ্ধ অর্গানিক গ্লো সিরাম। ত্বকের দাগ ছোপ হালকা করে, আর্দ্রতা ধরে রাখে এবং প্রাকৃতিকভাবে উজ্জ্বলতা ফিরিয়ে আনে। সব ধরনের ত্বকে ব্যবহারের উপযোগী।',
    regularPrice: 1450,
    salePrice: 1150,
    stock: 30,
    images: ['/src/assets/images/product_skincare_serum_1791605941479.jpg'],
    mainImage: '/src/assets/images/product_skincare_serum_1791605941479.jpg',
    variants: [
      { id: 'v1', name: 'ভলিউম', options: ['30ml', '50ml'] }
    ],
    isFeatured: true,
    isPopular: true,
    isPublished: true,
    rating: 5.0,
    reviewCount: 29,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    slug: 'wireless-active-noise-cancelling-earbuds',
    sku: 'ZX-EL-04',
    name: 'ওয়্যারলেস নয়েজ ক্যানসেলিং বাডস প্রো (Deep Bass)',
    category: 'cat-3',
    description: 'অ্যাক্টিভ নয়েজ ক্যানসেলেশন ও ৪ মাইক্রোফোন ক্রিস্টাল ক্লিয়ার কলিং। গেমিংয়ের জন্য লো ল্যাটেন্সি মোড ও টাইপ-সি ফাস্ট চার্জিং সুবিধা। ২০ ঘণ্টারও বেশি কম্বাইন্ড প্লেটাইম।',
    regularPrice: 1950,
    salePrice: 1550,
    stock: 18,
    images: ['/src/assets/images/hero_ecommerce_banner_1791605905466.jpg'],
    mainImage: '/src/assets/images/hero_ecommerce_banner_1791605905466.jpg',
    variants: [
      { id: 'v1', name: 'রং', options: ['সাদা', 'কালো'] }
    ],
    isFeatured: true,
    isPopular: true,
    isPublished: true,
    rating: 4.7,
    reviewCount: 41,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    slug: 'stainless-steel-thermal-water-bottle',
    sku: 'ZX-HK-05',
    name: 'ইনসুলেটেড স্টেইনলেস স্টিল ভ্যাকুয়াম বোতল (750ml)',
    category: 'cat-4',
    description: 'ডাবল ওয়াল ভ্যাকুয়াম ইনসুলেশন যুক্ত। গরম পানি ১২ ঘণ্টা এবং ঠান্ডা পানি ২৪ ঘণ্টা পর্যন্ত তাপমাত্রা বজায় রাখে। বিপিএ মুক্ত ফুড-গ্রেড ৩১৪ স্টিল। অফিসে বা ভ্রমণে সহজে বহনযোগ্য।',
    regularPrice: 850,
    salePrice: 650,
    stock: 50,
    images: ['/src/assets/images/hero_ecommerce_banner_1791605905466.jpg'],
    mainImage: '/src/assets/images/hero_ecommerce_banner_1791605905466.jpg',
    variants: [
      { id: 'v1', name: 'রং', options: ['ম্যাট ব্ল্যাক', 'সিলভার', 'নেভি ব্লু'] }
    ],
    isFeatured: false,
    isPopular: true,
    isPublished: true,
    rating: 4.8,
    reviewCount: 19,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    slug: 'leather-formal-luxury-mens-watch',
    sku: 'ZX-WAT-06',
    name: 'ক্লাসিক লেদার স্ট্র্যাপ জেন্টলম্যান অ্যানালগ ওয়াচ',
    category: 'cat-5',
    description: 'জাপানিজ কোয়ার্টজ মুভমেন্ট, স্ক্র্যাচ-রেজিস্ট্যান্ট স্যাফায়ার গ্লাস এবং প্রিমিয়াম জেনুইন লেদার স্ট্র্যাপ। ৩ বার ওয়াটার রেজিস্ট্যান্স ও অটো ডেট ডিসপ্লে সুবিধা। ১ বছরের ওয়ারেন্টি।',
    regularPrice: 2400,
    salePrice: 1890,
    stock: 12,
    images: ['/src/assets/images/product_smartwatch_black_1791605919110.jpg'],
    mainImage: '/src/assets/images/product_smartwatch_black_1791605919110.jpg',
    variants: [
      { id: 'v1', name: 'ডায়াল রং', options: ['সাদা ডায়াল', 'কালো ডায়াল'] }
    ],
    isFeatured: true,
    isPopular: false,
    isPublished: true,
    rating: 4.9,
    reviewCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    slug: 'montessori-wooden-educational-toy',
    sku: 'ZX-BB-07',
    name: 'মনটেসরি কাঠের এডুকেশনাল লার্নিং পাজল সেট',
    category: 'cat-6',
    description: 'বাচ্চাদের মেধা বিকাশ ও মনোযোগ বৃদ্ধির জন্য নিখুঁত কাঠের বর্ণমালা ও সংখ্যার পাজল। সম্পূর্ণ নন-টক্সিক ও পরিবেশবান্ধব রঙে প্রস্তুত, ধারালো কোনো প্রান্ত নেই। ২ থেকে ৬ বছর বয়সী বাচ্চাদের জন্য আদর্শ।',
    regularPrice: 950,
    salePrice: 750,
    stock: 22,
    images: ['/src/assets/images/hero_ecommerce_banner_1791605905466.jpg'],
    mainImage: '/src/assets/images/hero_ecommerce_banner_1791605905466.jpg',
    variants: [],
    isFeatured: false,
    isPopular: true,
    isPublished: true,
    rating: 4.9,
    reviewCount: 22,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    slug: 'adjustable-hand-grip-gym-fitness',
    sku: 'ZX-SPT-08',
    name: 'অ্যাডজাস্টেবল হ্যান্ড গ্রিপ স্ট্রেন্থেনার (10-60 KG)',
    category: 'cat-7',
    description: '১০ থেকে ৬০ কেজি পর্যন্ত রেজিস্ট্যান্স অ্যাডজাস্টেবল মেকানিকাল কাউন্টার সহ ফিটনেস গ্রিপার। হাত ও কব্জির শক্তি বৃদ্ধির জন্য প্রতিদিনের শরীরচর্চায় অত্যন্ত কার্যকর।',
    regularPrice: 550,
    salePrice: 390,
    stock: 60,
    images: ['/src/assets/images/hero_ecommerce_banner_1791605905466.jpg'],
    mainImage: '/src/assets/images/hero_ecommerce_banner_1791605905466.jpg',
    variants: [
      { id: 'v1', name: 'রং', options: ['কালো', 'কমলা', 'নীল'] }
    ],
    isFeatured: false,
    isPopular: true,
    isPublished: true,
    rating: 4.6,
    reviewCount: 34,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultReviews: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    productName: 'ম্যাট ব্ল্যাক প্রিমিয়াম স্মার্টওয়াচ আল্ট্রা',
    customerName: 'তানভীর আহমেদ',
    rating: 5,
    comment: 'অসাধারণ বিল্ড কোয়ালিটি! ব্যাটারি ব্যাকআপ এক সপ্তাহেও শেষ হয়নি। ডিসপ্লে অনেক শার্প। ধানমন্ডিতে ২ দিনের মধ্যে ডেলিভারি পেয়েছি।',
    isApproved: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rev-2',
    productId: 'prod-2',
    productName: 'রয়্যাল নেভি ব্লু এক্সক্লুসিভ কটন পাঞ্জাবি',
    customerName: 'মেহেদী হাসান',
    rating: 5,
    comment: 'কাপড়টা যেমন চেয়েছিলাম ঠিক তেমনই সফট ও আরামদায়ক। সাইজ একবারে পারফেক্ট এসেছে। ক্যাশ অন ডেলিভারিতে চেক করে নিতে পেরে নিশ্চিন্ত ছিলাম।',
    isApproved: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'rev-3',
    productId: 'prod-3',
    productName: 'অরা বোটানিক্যালস ন্যাচারাল গ্লো রেডিয়েন্স সিরাম',
    customerName: 'ফারজানা ইয়াসমিন',
    rating: 5,
    comment: '১০০% অরিজিনাল প্রডাক্ট! প্যাকেজিং অনেক সুন্দর ছিল। নিয়মিত ব্যবহারে ত্বকের গ্লো অনেক বেড়েছে। ধন্যবাদ ZX Shop!',
    isApproved: true,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

const DB_BACKUP_FILE = path.resolve(process.cwd(), 'data', 'db.json.bak');
const DB_BACKUPS_DIR = path.resolve(process.cwd(), 'data', 'backups');

export class Database {
  private static instance: Database;
  private data: DatabaseSchema;
  private lastBackupTime = 0;

  private constructor() {
    this.data = this.loadData();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private loadData(): DatabaseSchema {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_BACKUPS_DIR)) {
      fs.mkdirSync(DB_BACKUPS_DIR, { recursive: true });
    }

    // 1. Primary load attempt from DB_FILE
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        if (fileContent.trim().length > 0) {
          const parsed = JSON.parse(fileContent);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.products)) {
            console.log(`[Database] Loaded ${parsed.products.length} products successfully from ${DB_FILE}`);
            return parsed;
          }
        }
      } catch (e) {
        console.error('[Database ERROR] Corrupted or invalid JSON in primary db.json:', e);
      }
    }

    // 2. Fallback attempt from DB_BACKUP_FILE
    if (fs.existsSync(DB_BACKUP_FILE)) {
      try {
        console.warn('[Database] Attempting recovery from db.json.bak...');
        const backupContent = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
        const parsed = JSON.parse(backupContent);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.products)) {
          console.log(`[Database RECOVERY] Successfully recovered ${parsed.products.length} products from backup!`);
          fs.writeFileSync(DB_FILE, backupContent, 'utf-8');
          return parsed;
        }
      } catch (err) {
        console.error('[Database ERROR] Failed to recover from db.json.bak:', err);
      }
    }

    // 3. Fallback attempt from rolling snapshots in data/backups/
    try {
      if (fs.existsSync(DB_BACKUPS_DIR)) {
        const snapshotFiles = fs.readdirSync(DB_BACKUPS_DIR)
          .filter(f => f.startsWith('db_') && f.endsWith('.json'))
          .sort()
          .reverse();

        for (const snap of snapshotFiles) {
          try {
            const snapPath = path.join(DB_BACKUPS_DIR, snap);
            const snapContent = fs.readFileSync(snapPath, 'utf-8');
            const parsed = JSON.parse(snapContent);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.products) && parsed.products.length > 0) {
              console.log(`[Database RECOVERY] Recovered from snapshot ${snap}!`);
              fs.writeFileSync(DB_FILE, snapContent, 'utf-8');
              return parsed;
            }
          } catch {
            // continue checking next snapshot
          }
        }
      }
    } catch (snapErr) {
      console.error('[Database] Error checking snapshots:', snapErr);
    }

    // 4. Fallback attempt from public/data/db.json (static copy)
    const publicDbFile = path.resolve(process.cwd(), 'public', 'data', 'db.json');
    if (fs.existsSync(publicDbFile)) {
      try {
        const publicContent = fs.readFileSync(publicDbFile, 'utf-8');
        const parsed = JSON.parse(publicContent);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.products) && parsed.products.length > 0) {
          console.log('[Database RECOVERY] Successfully recovered from public/data/db.json mirror!');
          fs.writeFileSync(DB_FILE, publicContent, 'utf-8');
          return parsed;
        }
      } catch {}
    }

    // 5. Fallback attempt from .audit_backups master backup
    const masterBackupFile = path.resolve(process.cwd(), '.audit_backups', 'db.json.pre_audit.bak');
    if (fs.existsSync(masterBackupFile)) {
      try {
        const auditContent = fs.readFileSync(masterBackupFile, 'utf-8');
        const parsed = JSON.parse(auditContent);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.products) && parsed.products.length > 0) {
          console.log('[Database RECOVERY] Successfully recovered from audit backup!');
          fs.writeFileSync(DB_FILE, auditContent, 'utf-8');
          return parsed;
        }
      } catch {}
    }

    // 4. Default initialization ONLY if absolutely no valid database or backup exists
    console.warn('[Database] No existing database or backup found. Initializing default data...');
    const salt = 'zx_shop_salt_2026';
    const initialData: DatabaseSchema = {
      products: defaultProducts,
      categories: defaultCategories,
      orders: [],
      deliveryZones: defaultDeliveryZones,
      coupons: defaultCoupons,
      reviews: defaultReviews,
      settings: defaultSettings,
      adminCredentials: {
        username: 'admin',
        passwordHash: hashPassword('admin123', salt),
        salt: salt,
      },
    };

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write initial db.json:', err);
    }

    return initialData;
  }

  public save(): boolean {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(DB_BACKUPS_DIR)) {
        fs.mkdirSync(DB_BACKUPS_DIR, { recursive: true });
      }

      // Serialize data and verify before touching disk
      const jsonStr = JSON.stringify(this.data, null, 2);
      if (!jsonStr || jsonStr.length < 50) {
        throw new Error('Attempted to save empty or malformed database state');
      }

      // Safe Backup: copy existing working db.json to db.json.bak
      if (fs.existsSync(DB_FILE)) {
        try {
          fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
        } catch (copyErr) {
          console.warn('[Database] Could not update db.json.bak:', copyErr);
        }
      }

      // Rolling snapshot (throttle to once per minute or during critical product edits)
      const now = Date.now();
      if (now - this.lastBackupTime > 60000) {
        try {
          const snapPath = path.join(DB_BACKUPS_DIR, `db_${now}.json`);
          fs.writeFileSync(snapPath, jsonStr, 'utf-8');
          this.lastBackupTime = now;

          // Prune old snapshots, keep latest 20
          const oldSnaps = fs.readdirSync(DB_BACKUPS_DIR)
            .filter(f => f.startsWith('db_') && f.endsWith('.json'))
            .sort();
          while (oldSnaps.length > 20) {
            const toDelete = oldSnaps.shift();
            if (toDelete) {
              fs.unlinkSync(path.join(DB_BACKUPS_DIR, toDelete));
            }
          }
        } catch (snapErr) {
          console.warn('[Database] Snapshot save warning:', snapErr);
        }
      }

      // Atomic write with robust fallback for container overlay filesystems
      const tmpFile = `${DB_FILE}.${now}.${Math.random().toString(36).slice(2)}.tmp`;
      try {
        fs.writeFileSync(tmpFile, jsonStr, 'utf-8');
        try {
          fs.renameSync(tmpFile, DB_FILE);
        } catch {
          fs.writeFileSync(DB_FILE, jsonStr, 'utf-8');
          try { fs.unlinkSync(tmpFile); } catch {}
        }
      } catch {
        fs.writeFileSync(DB_FILE, jsonStr, 'utf-8');
      }

      // Also mirror to public/data if public exists for production static backup
      const publicDataDir = path.resolve(process.cwd(), 'public', 'data');
      if (fs.existsSync(path.resolve(process.cwd(), 'public'))) {
        try {
          if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });
          fs.writeFileSync(path.join(publicDataDir, 'db.json'), jsonStr, 'utf-8');
        } catch {}
      }

      return true;
    } catch (err) {
      console.error('[Database ERROR] Critical failure saving db.json:', err);
      return false;
    }
  }

  public restoreFromData(incomingData: any): boolean {
    if (!incomingData || typeof incomingData !== 'object' || !Array.isArray(incomingData.products)) {
      return false;
    }
    this.data.products = incomingData.products;
    if (incomingData.categories && Array.isArray(incomingData.categories)) {
      this.data.categories = incomingData.categories;
    }
    if (incomingData.settings && typeof incomingData.settings === 'object') {
      this.data.settings = { ...this.data.settings, ...incomingData.settings };
    }
    if (incomingData.deliveryZones && Array.isArray(incomingData.deliveryZones)) {
      this.data.deliveryZones = incomingData.deliveryZones;
    }
    if (incomingData.coupons && Array.isArray(incomingData.coupons)) {
      this.data.coupons = incomingData.coupons;
    }
    return this.save();
  }

  public createExplicitBackup(label = 'manual'): string | null {
    try {
      const timestamp = Date.now();
      const snapPath = path.join(DB_BACKUPS_DIR, `db_${label}_${timestamp}.json`);
      fs.writeFileSync(snapPath, JSON.stringify(this.data, null, 2), 'utf-8');
      return snapPath;
    } catch (err) {
      console.error('Failed to create explicit backup:', err);
      return null;
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Admin Session Token Management
  public isValidAdminToken(token: string): boolean {
    if (!token) return false;
    if (!this.data.adminSessions) {
      this.data.adminSessions = [];
    }
    return this.data.adminSessions.includes(token);
  }

  public addAdminToken(token: string): void {
    if (!this.data.adminSessions) {
      this.data.adminSessions = [];
    }
    if (!this.data.adminSessions.includes(token)) {
      this.data.adminSessions.push(token);
      if (this.data.adminSessions.length > 20) {
        this.data.adminSessions = this.data.adminSessions.slice(-20);
      }
      this.save();
    }
  }

  public removeAdminToken(token: string): void {
    if (this.data.adminSessions) {
      this.data.adminSessions = this.data.adminSessions.filter(t => t !== token);
      this.save();
    }
  }

  // Verify Admin Login
  public verifyAdmin(username: string, pass: string): boolean {
    const creds = this.data.adminCredentials;
    if (creds.username !== username) return false;
    const computed = hashPassword(pass, creds.salt);
    return computed === creds.passwordHash;
  }

  public updateAdminPassword(newPass: string): void {
    const salt = crypto.randomBytes(16).toString('hex');
    this.data.adminCredentials = {
      username: this.data.adminCredentials.username,
      passwordHash: hashPassword(newPass, salt),
      salt: salt,
    };
    this.save();
  }
}

export const dbInstance = Database.getInstance();
