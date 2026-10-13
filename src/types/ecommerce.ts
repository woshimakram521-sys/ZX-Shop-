export interface Variant {
  id: string;
  name: string; // e.g., 'সাইজ' or 'রং'
  options: string[]; // e.g., ['M', 'L', 'XL'] or ['কালো', 'নীল']
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  banglaTitle?: string;
  category: string; // category id or slug
  description: string;
  regularPrice: number;
  salePrice?: number;
  stock: number;
  images: string[];
  mainImage: string;
  variants?: Variant[];
  isFeatured: boolean;
  isPopular: boolean;
  isPublished: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  banglaName: string;
  icon?: string;
  image?: string;
  description?: string;
  isPublished: boolean;
  order: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  rate: number;
  estimatedDays: string;
  isActive: boolean;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  isActive: boolean;
  expiresAt?: string;
}

export type OrderStatus = 
  | 'pending'    // অর্ডার গ্রহণ করা হয়েছে
  | 'confirmed'  // নিশ্চিত করা হয়েছে
  | 'processing' // প্যাকেজিং বা প্রসেসিং
  | 'shipped'    // পাঠানো হয়েছে
  | 'delivered'  // ডেলিভারি সম্পন্ন
  | 'cancelled'; // বাতিল

export type PaymentMethod = 'cod' | 'bkash' | 'nagad';
export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'refunded';

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  selectedVariants?: Record<string, string>;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ZX-202610-843
  customer: {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    deliveryArea: string;
    fullAddress: string;
    notes?: string;
  };
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryCharge: number;
  deliveryZoneName: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  senderPhone?: string;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  emailNotificationStatus?: 'pending' | 'sent' | 'failed' | 'not_configured';
  emailNotificationError?: string;
  emailSentAt?: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  logoUrl?: string;
  contactPhone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  bkashNumber: string;
  bkashType: 'Personal' | 'Merchant';
  nagadNumber: string;
  nagadType: 'Personal' | 'Merchant';
  freeDeliveryThreshold?: number;
  announcementNotice?: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImage: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  aboutStory: string;
  privacyPolicy: string;
  termsConditions: string;
  returnPolicy: string;
  metaTitle: string;
  metaDescription: string;
  // Gmail SMTP & Order Notification Settings
  smtpUser?: string;
  smtpPass?: string;
  smtpHost?: string;
  smtpPort?: number;
  adminNotificationEmail?: string;
  hasSmtpPass?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  orders: Order[];
  deliveryZones: DeliveryZone[];
  coupons: Coupon[];
  reviews: Review[];
  settings: StoreSettings;
  adminCredentials: {
    username: string;
    passwordHash: string; // SHA-256 with salt or simple hashed
    salt: string;
    lastLogin?: string;
  };
  adminSessions?: string[];
}
