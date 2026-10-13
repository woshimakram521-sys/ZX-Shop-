import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { dbInstance } from './server/db.ts';
import type { Product, Order, OrderStatus, PaymentStatus, Review, Coupon, Category, DeliveryZone, StoreSettings } from './src/types/ecommerce.ts';
import { sendOrderNotificationEmail, sendTestNotificationEmail, isEmailConfigured, getEmailServiceStatus } from './server/emailService.ts';

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure uploads folder exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

// In-memory admin session storage (backed by persistent DB storage)
const activeAdminTokens = new Set<string>();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'অননুমোদিত প্রবেশ। অনুগ্রহ করে অ্যাডমিন লগইন করুন।' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeAdminTokens.has(token) && !dbInstance.isValidAdminToken(token)) {
    return res.status(401).json({ error: 'লগইন সেশন মেয়াদোত্তীর্ণ বা অবৈধ। অনুগ্রহ করে আবার লগইন করুন।' });
  }
  activeAdminTokens.add(token);
  next();
}

// ==========================================
// 1. PUBLIC STOREFRONT APIS
// ==========================================

// Bootstrap initial configuration
app.get('/api/bootstrap', (req: Request, res: Response) => {
  const data = dbInstance.getData();
  const publishedCategories = data.categories
    .filter(c => c.isPublished)
    .sort((a, b) => a.order - b.order);
  const activeDeliveryZones = data.deliveryZones.filter(z => z.isActive);
  
  // Publicly safe settings: strip server-side credentials
  const { smtpPass, smtpUser, ...publicSettings } = data.settings;

  res.json({
    settings: publicSettings,
    categories: publishedCategories,
    deliveryZones: activeDeliveryZones,
    products: data.products.filter(p => p.isPublished),
    featuredProducts: data.products.filter(p => p.isPublished && p.isFeatured).slice(0, 12),
    popularProducts: data.products.filter(p => p.isPublished && p.isPopular).slice(0, 12),
    totalPublishedProducts: data.products.filter(p => p.isPublished).length,
  });
});

// Products listing with filters
app.get('/api/products', (req: Request, res: Response) => {
  const data = dbInstance.getData();
  let items = data.products.filter(p => p.isPublished);

  const { category, search, minPrice, maxPrice, sort, featured, popular, page = '1', limit = '12' } = req.query;

  // Filter by category
  if (category && typeof category === 'string' && category !== 'all') {
    const targetCat = data.categories.find(c => c.slug === category || c.id === category);
    if (targetCat) {
      items = items.filter(p => p.category === targetCat.id || p.category === targetCat.slug);
    }
  }

  // Filter by search query
  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    items = items.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.banglaTitle && p.banglaTitle.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }

  // Filter by price
  if (minPrice && !isNaN(Number(minPrice))) {
    items = items.filter(p => (p.salePrice ?? p.regularPrice) >= Number(minPrice));
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    items = items.filter(p => (p.salePrice ?? p.regularPrice) <= Number(maxPrice));
  }

  // Filter by flags
  if (featured === 'true') {
    items = items.filter(p => p.isFeatured);
  }
  if (popular === 'true') {
    items = items.filter(p => p.isPopular);
  }

  // Sorting
  if (sort === 'price_asc') {
    items.sort((a, b) => (a.salePrice ?? a.regularPrice) - (b.salePrice ?? b.regularPrice));
  } else if (sort === 'price_desc') {
    items.sort((a, b) => (b.salePrice ?? b.regularPrice) - (a.salePrice ?? a.regularPrice));
  } else if (sort === 'popular') {
    items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else {
    // Default newest
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.max(1, parseInt(limit as string, 10));
  const total = items.length;
  const totalPages = Math.ceil(total / limitNum);
  const paginated = items.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    products: paginated,
    total,
    page: pageNum,
    totalPages,
  });
});

// Single product details
app.get('/api/products/:slugOrId', (req: Request, res: Response) => {
  const data = dbInstance.getData();
  const { slugOrId } = req.params;
  const product = data.products.find(p => (p.id === slugOrId || p.slug === slugOrId) && p.isPublished);

  if (!product) {
    return res.status(404).json({ error: 'পণ্যটি পাওয়া যায়নি।' });
  }

  // Related products:
  // 1. First, products from the exact same category (excluding current product)
  const sameCategory = data.products.filter(
    p => p.isPublished && p.category === product.category && p.id !== product.id
  );

  let related = [...sameCategory];

  // 2. If fewer than 8 in same category, supplement with popular / other published products
  if (related.length < 8) {
    const existingIds = new Set([product.id, ...related.map(r => r.id)]);
    const remainingNeeded = 8 - related.length;
    const additional = data.products
      .filter(p => p.isPublished && !existingIds.has(p.id))
      .sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, remainingNeeded);
    related = [...related, ...additional];
  } else {
    related = related.slice(0, 8);
  }

  // Reviews for this product
  const reviews = data.reviews.filter(r => r.productId === product.id && r.isApproved);

  res.json({
    product,
    related,
    reviews,
  });
});

// Check & Apply Coupon
app.post('/api/coupons/apply', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, message: 'কুপন কোড প্রদান করুন।' });
  }

  const data = dbInstance.getData();
  const coupon = data.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);

  if (!coupon) {
    return res.status(400).json({ valid: false, message: 'অবৈধ অথবা মেয়াদোত্তীর্ণ কুপন কোড।' });
  }

  if (subtotal < coupon.minOrderAmount) {
    return res.status(400).json({
      valid: false,
      message: `এই কুপনটি ব্যবহারের জন্য সর্বনিম্ন ৳${coupon.minOrderAmount} টাকার অর্ডার প্রয়োজন।`,
    });
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
  } else {
    discount = coupon.discountValue;
  }
  discount = Math.min(discount, subtotal);

  res.json({
    valid: true,
    code: coupon.code,
    discount,
    message: `অভিনন্দন! ৳${discount} ছাড় যুক্ত হয়েছে।`,
  });
});

// Guest Checkout & Order Creation
app.post('/api/orders', (req: Request, res: Response) => {
  const { customer, items, paymentMethod, transactionId, senderPhone, deliveryZoneId, couponCode } = req.body;

  // Validate customer inputs
  if (!customer?.fullName?.trim()) {
    return res.status(400).json({ error: 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।' });
  }
  const phoneClean = (customer?.phone || '').replace(/[^0-9]/g, '');
  if (!phoneClean || phoneClean.length < 11) {
    return res.status(400).json({ error: 'সঠিক বাংলাদেশি ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' });
  }
  if (!customer?.fullAddress?.trim()) {
    return res.status(400).json({ error: 'সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'কার্টে কোনো পণ্য নেই।' });
  }

  const data = dbInstance.getData();

  // Validate delivery zone
  const zone = data.deliveryZones.find(z => z.id === deliveryZoneId || z.name === customer.deliveryArea);
  if (!zone) {
    return res.status(400).json({ error: 'অনুগ্রহ করে সঠিক ডেলিভারি এলাকা নির্বাচন করুন।' });
  }

  // Validate stock and snapshot prices server-side
  let calculatedSubtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const prod = data.products.find(p => p.id === item.productId && p.isPublished);
    if (!prod) {
      return res.status(400).json({ error: 'একটি পণ্য পাওয়া যায়নি বা এটি শপ থেকে সরানো হয়েছে।' });
    }
    if (prod.stock < item.quantity) {
      return res.status(400).json({
        error: `দুঃখিত! "${prod.name}" পণ্যটির পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${prod.stock} টি।`,
      });
    }

    const itemPrice = prod.salePrice ?? prod.regularPrice;
    const itemTotal = itemPrice * item.quantity;
    calculatedSubtotal += itemTotal;

    verifiedItems.push({
      productId: prod.id,
      name: prod.name,
      sku: prod.sku,
      price: itemPrice,
      quantity: item.quantity,
      image: prod.mainImage,
      selectedVariants: item.selectedVariants || {},
      total: itemTotal,
    });
  }

  // Coupon calculation
  let discountAmount = 0;
  if (couponCode) {
    const coupon = data.coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive);
    if (coupon && calculatedSubtotal >= coupon.minOrderAmount) {
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
      } else {
        discountAmount = coupon.discountValue;
      }
      discountAmount = Math.min(discountAmount, calculatedSubtotal);
    }
  }

  // Delivery charge calculation
  let deliveryFee = zone.rate;
  if (data.settings.freeDeliveryThreshold && calculatedSubtotal >= data.settings.freeDeliveryThreshold) {
    deliveryFee = 0;
  }

  const finalTotal = calculatedSubtotal - discountAmount + deliveryFee;

  // Deduct stock atomically
  for (const item of items) {
    const prod = data.products.find(p => p.id === item.productId);
    if (prod) {
      prod.stock -= item.quantity;
      prod.updatedAt = new Date().toISOString();
    }
  }

  // Generate unique order number
  const timestamp = Date.now().toString().slice(-4);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const orderNumber = `ZX-${timestamp}${randomSuffix}`;

  const newOrder: Order = {
    id: `ord-${Date.now()}-${randomSuffix}`,
    orderNumber,
    customer: {
      fullName: customer.fullName.trim(),
      phone: phoneClean,
      division: customer.division || '',
      district: customer.district || '',
      deliveryArea: zone.name,
      fullAddress: customer.fullAddress.trim(),
      notes: customer.notes?.trim() || '',
    },
    items: verifiedItems,
    subtotal: calculatedSubtotal,
    discount: discountAmount,
    couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
    deliveryCharge: deliveryFee,
    deliveryZoneName: zone.name,
    totalAmount: finalTotal,
    paymentMethod: paymentMethod || 'cod',
    paymentStatus: paymentMethod === 'cod' ? 'pending' : (transactionId ? 'pending' : 'pending'),
    transactionId: transactionId?.trim() || undefined,
    senderPhone: senderPhone?.trim() || undefined,
    orderStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'অর্ডারটি সফলভাবে জমা নেওয়া হয়েছে। খুব শীঘ্রই আমাদের প্রতিনিধি কল দিয়ে নিশ্চিত করবেন।',
      },
    ],
  };

  newOrder.emailNotificationStatus = isEmailConfigured() ? 'pending' : 'not_configured';

  data.orders.unshift(newOrder);
  dbInstance.save();

  // Send asynchronous Gmail notification to admin (never blocks customer checkout response)
  sendOrderNotificationEmail(newOrder)
    .then((result) => {
      if (result.success && !result.skipped) {
        newOrder.emailNotificationStatus = 'sent';
        newOrder.emailSentAt = new Date().toISOString();
        dbInstance.save();
      } else if (!result.success) {
        newOrder.emailNotificationStatus = isEmailConfigured() ? 'failed' : 'not_configured';
        newOrder.emailNotificationError = result.error;
        dbInstance.save();
      }
    })
    .catch((err) => {
      console.error(`[Email Notification UNCAUGHT] Error for order ${newOrder.orderNumber}:`, err);
    });

  res.status(201).json({
    success: true,
    orderNumber: newOrder.orderNumber,
    order: newOrder,
  });
});

// Track Order with Order Number + Phone
app.post('/api/orders/track', (req: Request, res: Response) => {
  const { orderNumber, phone } = req.body;
  if (!orderNumber || !phone) {
    return res.status(400).json({ error: 'অর্ডার নম্বর এবং মোবাইল নম্বর দুটোই প্রয়োজন।' });
  }

  const cleanNum = orderNumber.trim().toUpperCase();
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const data = dbInstance.getData();
  const order = data.orders.find(o => 
    o.orderNumber.toUpperCase() === cleanNum &&
    (o.customer.phone === cleanPhone || o.customer.phone.endsWith(cleanPhone) || cleanPhone.endsWith(o.customer.phone))
  );

  if (!order) {
    return res.status(404).json({ error: 'প্রদত্ত তথ্য অনুযায়ী কোনো অর্ডার পাওয়া যায়নি। সঠিক অর্ডার নম্বর ও নম্বর যাচাই করুন।' });
  }

  // Safe tracking info - mask customer phone and address slightly for privacy
  const maskedPhone = order.customer.phone.slice(0, 3) + '*****' + order.customer.phone.slice(-3);

  res.json({
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    statusHistory: order.statusHistory,
    totalAmount: order.totalAmount,
    deliveryZoneName: order.deliveryZoneName,
    items: order.items.map(i => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
      selectedVariants: i.selectedVariants,
    })),
    maskedPhone,
    deliveryArea: order.customer.deliveryArea,
  });
});

// Submit product review
app.post('/api/reviews', (req: Request, res: Response) => {
  const { productId, customerName, rating, comment } = req.body;
  if (!productId || !customerName || !rating || !comment) {
    return res.status(400).json({ error: 'সকল তথ্য পূরণ করা আবশ্যক।' });
  }

  const data = dbInstance.getData();
  const product = data.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'পণ্যটি পাওয়া যায়নি।' });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId,
    productName: product.name,
    customerName: customerName.trim(),
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: comment.trim(),
    isApproved: true, // Auto approve for instant engagement
    createdAt: new Date().toISOString(),
  };

  data.reviews.unshift(newReview);
  
  // Recompute product rating
  const prodReviews = data.reviews.filter(r => r.productId === productId && r.isApproved);
  const avg = prodReviews.reduce((acc, cur) => acc + cur.rating, 0) / prodReviews.length;
  product.rating = Math.round(avg * 10) / 10;
  product.reviewCount = prodReviews.length;

  dbInstance.save();

  res.status(201).json({ success: true, review: newReview, message: 'আপনার মূল্যবান মতামতের জন্য ধন্যবাদ!' });
});

// Image Upload Endpoint (stores base64 into uploads/ folder)
app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { filename, base64 } = req.body;
    if (!base64 || typeof base64 !== 'string') {
      return res.status(400).json({ error: 'ছবির ডেটা পাওয়া যায়নি।' });
    }

    const cleanBase64 = base64.trim();
    const matches = cleanBase64.match(/^data:([^;]+);base64,([\s\S]+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      else if (mime.includes('svg')) ext = 'svg';
      else if (mime.includes('avif')) ext = 'avif';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(cleanBase64, 'base64');
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const safeName = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    // Also mirror to public/uploads if public exists
    const publicUploads = path.resolve(process.cwd(), 'public', 'uploads');
    try {
      if (!fs.existsSync(publicUploads)) fs.mkdirSync(publicUploads, { recursive: true });
      fs.writeFileSync(path.join(publicUploads, safeName), buffer);
    } catch {}

    const fileUrl = `/uploads/${safeName}`;
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'ছবি সংরক্ষণ করতে ব্যর্থ হয়েছে।' });
  }
});

// ==========================================
// 2. ADMIN AUTH & DASHBOARD APIS
// ==========================================

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'ইউজারনেম ও পাসওয়ার্ড প্রদান করুন।' });
  }

  const isValid = dbInstance.verifyAdmin(username, password);
  if (!isValid) {
    return res.status(401).json({ error: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড।' });
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  activeAdminTokens.add(token);
  dbInstance.addAdminToken(token);

  res.json({
    success: true,
    token,
    username,
    message: 'স্বাগতম! অ্যাডমিন প্যানেলে সফলভাবে লগইন হয়েছে।',
  });
});

// Admin Logout
app.post('/api/admin/logout', requireAdmin, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeAdminTokens.delete(token);
    dbInstance.removeAdminToken(token);
  }
  res.json({ success: true, message: 'লগআউট সফল হয়েছে।' });
});

// Verify Admin Session
app.get('/api/admin/me', requireAdmin, (req: Request, res: Response) => {
  res.json({ success: true, username: 'admin' });
});

// Admin Dashboard Counters
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const data = dbInstance.getData();
  const totalProducts = data.products.length;
  const totalOrders = data.orders.length;
  const pendingOrders = data.orders.filter(o => o.orderStatus === 'pending').length;
  const processingOrders = data.orders.filter(o => o.orderStatus === 'processing').length;
  const completedOrders = data.orders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledOrders = data.orders.filter(o => o.orderStatus === 'cancelled').length;
  
  const totalRevenue = data.orders
    .filter(o => o.orderStatus === 'delivered')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const lowStockProducts = data.products.filter(p => p.stock <= 5);
  const recentOrders = data.orders.slice(0, 5);

  res.json({
    totalProducts,
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    recentOrders,
  });
});

// Admin Products CRUD
app.get('/api/admin/products', requireAdmin, (req: Request, res: Response) => {
  const data = dbInstance.getData();
  res.json({ products: data.products });
});

app.post('/api/admin/products', requireAdmin, (req: Request, res: Response) => {
  const { name, sku, category, description, regularPrice, salePrice, stock, images, mainImage, variants, isFeatured, isPopular, isPublished } = req.body;

  if (!name || !regularPrice) {
    return res.status(400).json({ error: 'পণ্যের নাম ও নিয়মিত মূল্য আবশ্যক।' });
  }

  const data = dbInstance.getData();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;
  const generatedSku = sku?.trim() || `ZX-${Math.floor(1000 + Math.random() * 9000)}`;

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
    sku: generatedSku,
    name: name.trim(),
    category: category || 'cat-1',
    description: description?.trim() || '',
    regularPrice: Number(regularPrice),
    salePrice: salePrice ? Number(salePrice) : undefined,
    stock: Number(stock) || 0,
    images: Array.isArray(images) && images.length ? images : (mainImage ? [mainImage] : []),
    mainImage: mainImage || (Array.isArray(images) && images[0]) || '',
    variants: Array.isArray(variants) ? variants : [],
    isFeatured: Boolean(isFeatured),
    isPopular: Boolean(isPopular),
    isPublished: isPublished !== false,
    rating: 5.0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.products.unshift(newProduct);
  const saveSuccess = dbInstance.save();
  if (!saveSuccess) {
    data.products.shift(); // Rollback in-memory state
    return res.status(500).json({ error: 'সার্ভার ডেটাবেসে পণ্য সংরক্ষণ করতে ব্যর্থ হয়েছে।' });
  }

  res.status(201).json({ success: true, product: newProduct });
});

app.put('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbInstance.getData();
  const index = data.products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'পণ্যটি পাওয়া যায়নি।' });
  }

  const existing = data.products[index];
  const oldProduct = { ...existing };
  const updated: Product = {
    ...existing,
    ...req.body,
    regularPrice: req.body.regularPrice !== undefined ? Number(req.body.regularPrice) : existing.regularPrice,
    salePrice: req.body.salePrice ? Number(req.body.salePrice) : undefined,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : existing.stock,
    updatedAt: new Date().toISOString(),
  };

  data.products[index] = updated;
  const saveSuccess = dbInstance.save();
  if (!saveSuccess) {
    data.products[index] = oldProduct; // Rollback
    return res.status(500).json({ error: 'পণ্য আপডেট ডেটাবেসে সংরক্ষণ ব্যর্থ হয়েছে।' });
  }

  res.json({ success: true, product: updated });
});

app.delete('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbInstance.getData();
  const initialLen = data.products.length;
  const existing = data.products.find(p => p.id === id);
  data.products = data.products.filter(p => p.id !== id);

  if (data.products.length === initialLen) {
    return res.status(404).json({ error: 'পণ্যটি পাওয়া যায়নি।' });
  }

  const saveSuccess = dbInstance.save();
  if (!saveSuccess) {
    if (existing) data.products.push(existing); // Rollback
    return res.status(500).json({ error: 'পণ্য মুছে ফেলার পর ডেটাবেস সংরক্ষণ ব্যর্থ হয়েছে।' });
  }

  res.json({ success: true, message: 'পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।' });
});

// Bulk actions for products
app.post('/api/admin/products/bulk', requireAdmin, (req: Request, res: Response) => {
  const { action, ids } = req.body;
  if (!action || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'অ্যাকশন ও প্রোডাক্ট নির্বাচন করুন।' });
  }

  const data = dbInstance.getData();
  const backupProducts = [...data.products];

  if (action === 'delete') {
    data.products = data.products.filter(p => !ids.includes(p.id));
  } else if (action === 'publish') {
    data.products.forEach(p => {
      if (ids.includes(p.id)) p.isPublished = true;
    });
  } else if (action === 'unpublish') {
    data.products.forEach(p => {
      if (ids.includes(p.id)) p.isPublished = false;
    });
  }

  const saveSuccess = dbInstance.save();
  if (!saveSuccess) {
    data.products = backupProducts; // Rollback
    return res.status(500).json({ error: 'বাল্ক পরিবর্তন ডেটাবেসে সংরক্ষণ ব্যর্থ হয়েছে।' });
  }

  res.json({ success: true, message: 'অপারেশন সফলভাবে সম্পন্ন হয়েছে।' });
});

// Duplicate product
app.post('/api/admin/products/duplicate/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbInstance.getData();
  const original = data.products.find(p => p.id === id);

  if (!original) {
    return res.status(404).json({ error: 'পণ্যটি পাওয়া যায়নি।' });
  }

  const copy: Product = {
    ...original,
    id: `prod-${Date.now()}`,
    name: `${original.name} (কপি)`,
    sku: `ZX-${Math.floor(1000 + Math.random() * 9000)}`,
    slug: `${original.slug}-copy-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.products.unshift(copy);
  const saveSuccess = dbInstance.save();
  if (!saveSuccess) {
    data.products.shift(); // Rollback
    return res.status(500).json({ error: 'পণ্য ক্লোন ডেটাবেসে সংরক্ষণ ব্যর্থ হয়েছে।' });
  }

  res.json({ success: true, product: copy });
});

// Admin Database Manual Backup
app.post('/api/admin/backup', requireAdmin, (req: Request, res: Response) => {
  const backupPath = dbInstance.createExplicitBackup('manual');
  if (backupPath) {
    res.json({ success: true, message: 'সফলভাবে ডেটাবেস ব্যাকআপ তৈরি হয়েছে!', filename: path.basename(backupPath) });
  } else {
    res.status(500).json({ error: 'ব্যাকআপ সংরক্ষণ ব্যর্থ হয়েছে।' });
  }
});

// Admin Orders
app.get('/api/admin/orders', requireAdmin, (req: Request, res: Response) => {
  const data = dbInstance.getData();
  const { status, search } = req.query;
  let orders = [...data.orders];

  if (status && typeof status === 'string' && status !== 'all') {
    orders = orders.filter(o => o.orderStatus === status);
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    orders = orders.filter(o => 
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.fullName.toLowerCase().includes(q) ||
      o.customer.phone.includes(q) ||
      (o.transactionId && o.transactionId.toLowerCase().includes(q))
    );
  }

  res.json({ orders });
});

// Update Order Status
app.patch('/api/admin/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body as { status: OrderStatus; note?: string };

  const data = dbInstance.getData();
  const order = data.orders.find(o => o.id === id || o.orderNumber === id);

  if (!order) {
    return res.status(404).json({ error: 'অর্ডারটি পাওয়া যায়নি।' });
  }

  const prevStatus = order.orderStatus;
  order.orderStatus = status;
  order.updatedAt = new Date().toISOString();
  order.statusHistory.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || `অর্ডারের অবস্থা পরিবর্তিত হয়েছে: ${status}`,
  });

  // If order was cancelled, restore stock!
  if (status === 'cancelled' && prevStatus !== 'cancelled') {
    for (const item of order.items) {
      const prod = data.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
      }
    }
  }

  dbInstance.save();
  res.json({ success: true, order });
});

// Verify Payment
app.patch('/api/admin/orders/:id/payment', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentStatus } = req.body as { paymentStatus: PaymentStatus };

  const data = dbInstance.getData();
  const order = data.orders.find(o => o.id === id || o.orderNumber === id);

  if (!order) {
    return res.status(404).json({ error: 'অর্ডারটি পাওয়া যায়নি।' });
  }

  order.paymentStatus = paymentStatus;
  order.updatedAt = new Date().toISOString();
  dbInstance.save();

  res.json({ success: true, order });
});

// Admin Email Notification Status
app.get('/api/admin/email-status', requireAdmin, (req: Request, res: Response) => {
  res.json(getEmailServiceStatus());
});

// Admin Resend Order Notification Email
app.post('/api/admin/orders/:id/resend-email', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbInstance.getData();
  const order = data.orders.find(o => o.id === id || o.orderNumber === id);

  if (!order) {
    return res.status(404).json({ error: 'অর্ডারটি পাওয়া যায়নি।' });
  }

  const result = await sendOrderNotificationEmail(order);
  if (result.success) {
    order.emailNotificationStatus = 'sent';
    order.emailSentAt = new Date().toISOString();
    order.emailNotificationError = undefined;
    dbInstance.save();
    return res.json({ success: true, message: 'অর্ডার নোটিফিকেশন ইমেইল সফলভাবে পাঠানো হয়েছে।' });
  } else {
    order.emailNotificationStatus = isEmailConfigured() ? 'failed' : 'not_configured';
    order.emailNotificationError = result.error;
    dbInstance.save();
    return res.status(500).json({
      success: false,
      error: result.error || 'ইমেইল পাঠানো ব্যর্থ হয়েছে। অনুগ্রহ করে সার্ভার SMTP কনফিগারেশন চেক করুন।',
    });
  }
});

// Admin Send Test Email
app.post('/api/admin/test-email', requireAdmin, async (req: Request, res: Response) => {
  const { recipient } = req.body;
  const result = await sendTestNotificationEmail(recipient);

  if (result.success) {
    return res.json({
      success: true,
      message: `টেস্ট ইমেইল সফলভাবে পাঠানো হয়েছে! প্রাপক: ${result.recipient}`,
      messageId: result.messageId,
      recipient: result.recipient,
    });
  } else {
    return res.status(400).json({
      success: false,
      error: result.error || 'টেস্ট ইমেইল পাঠানো সম্ভব হয়নি।',
      recipient: result.recipient,
    });
  }
});

// Categories Management
app.post('/api/admin/categories', requireAdmin, (req: Request, res: Response) => {
  const { name, banglaName, icon, isPublished } = req.body;
  if (!name && !banglaName) {
    return res.status(400).json({ error: 'ক্যাটাগরির নাম আবশ্যক।' });
  }

  const data = dbInstance.getData();
  const slug = (name || banglaName).toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cat-${Date.now()}`;
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    slug,
    name: name || banglaName,
    banglaName: banglaName || name,
    icon: icon || 'Tag',
    isPublished: isPublished !== false,
    order: data.categories.length + 1,
  };

  data.categories.push(newCat);
  dbInstance.save();
  res.status(201).json({ success: true, category: newCat });
});

app.put('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbInstance.getData();
  const cat = data.categories.find(c => c.id === id);

  if (!cat) {
    return res.status(404).json({ error: 'ক্যাটাগরি পাওয়া যায়নি।' });
  }

  Object.assign(cat, req.body);
  dbInstance.save();
  res.json({ success: true, category: cat });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbInstance.getData();
  data.categories = data.categories.filter(c => c.id !== id);
  dbInstance.save();
  res.json({ success: true, message: 'ক্যাটাগরি মুছে ফেলা হয়েছে।' });
});

// Delivery Zones
app.put('/api/admin/delivery-zones', requireAdmin, (req: Request, res: Response) => {
  const { zones } = req.body as { zones: DeliveryZone[] };
  if (!Array.isArray(zones)) {
    return res.status(400).json({ error: 'অবৈধ ডেলিভারি জোনের তালিকা।' });
  }

  const data = dbInstance.getData();
  data.deliveryZones = zones;
  dbInstance.save();
  res.json({ success: true, zones: data.deliveryZones });
});

// Coupons
app.post('/api/admin/coupons', requireAdmin, (req: Request, res: Response) => {
  const { code, discountType, discountValue, minOrderAmount } = req.body;
  if (!code || !discountValue) {
    return res.status(400).json({ error: 'কুপন কোড ও ছাড়ের পরিমাণ প্রয়োজন।' });
  }

  const data = dbInstance.getData();
  const newCoupon: Coupon = {
    code: code.trim().toUpperCase(),
    discountType: discountType || 'fixed',
    discountValue: Number(discountValue),
    minOrderAmount: Number(minOrderAmount) || 0,
    isActive: true,
  };

  data.coupons = data.coupons.filter(c => c.code !== newCoupon.code);
  data.coupons.push(newCoupon);
  dbInstance.save();

  res.status(201).json({ success: true, coupon: newCoupon });
});

app.delete('/api/admin/coupons/:code', requireAdmin, (req: Request, res: Response) => {
  const { code } = req.params;
  const data = dbInstance.getData();
  data.coupons = data.coupons.filter(c => c.code !== code.toUpperCase());
  dbInstance.save();
  res.json({ success: true, message: 'কুপন মুছে ফেলা হয়েছে।' });
});

// Settings - GET Admin Settings (Authenticated only, safe representation of secrets)
app.get('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const data = dbInstance.getData();
  const safeSettings: StoreSettings = {
    ...data.settings,
    smtpPass: '', // Never leak raw password to client browser
    hasSmtpPass: Boolean(data.settings.smtpPass),
  };
  res.json({ success: true, settings: safeSettings });
});

// Settings - PUT Admin Settings (Validated, normalized, safe persistence)
app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  try {
    const data = dbInstance.getData();
    const body = req.body || {};

    // 1. Validate Store Name if provided
    if (body.storeName !== undefined && typeof body.storeName === 'string' && !body.storeName.trim()) {
      return res.status(400).json({ success: false, error: 'দোকানের নাম খালি রাখা যাবে না।' });
    }

    // 2. Validate Admin Notification Email
    let adminEmail: string | undefined = undefined;
    if (body.adminNotificationEmail !== undefined && body.adminNotificationEmail !== null) {
      const emailStr = String(body.adminNotificationEmail).trim();
      if (emailStr !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailStr)) {
          return res.status(400).json({
            success: false,
            error: 'অ্যাডমিন নোটিফিকেশন ইমেইলটি সঠিক নয়। অনুগ্রহ করে একটি বৈধ ইমেইল দিন (যেমন: mdmohammad.644633815@gmail.com)।',
            field: 'adminNotificationEmail',
          });
        }
        adminEmail = emailStr;
      } else {
        adminEmail = 'mdmohammad.644633815@gmail.com';
      }
    }

    // 3. Validate SMTP User (Gmail address)
    let smtpUser: string | undefined = undefined;
    if (body.smtpUser !== undefined && body.smtpUser !== null) {
      const userStr = String(body.smtpUser).trim();
      if (userStr !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userStr)) {
          return res.status(400).json({
            success: false,
            error: 'প্রেরক Gmail আইডি (SMTP User) একটি সঠিক ইমেইল হতে হবে (যেমন: yourstore@gmail.com)।',
            field: 'smtpUser',
          });
        }
        smtpUser = userStr;
      } else {
        smtpUser = '';
      }
    }

    // 4. Validate SMTP Host
    let smtpHost: string | undefined = undefined;
    if (body.smtpHost !== undefined && body.smtpHost !== null) {
      const hostStr = String(body.smtpHost).trim();
      if (hostStr !== '') {
        const hostRegex = /^[a-zA-Z0-9.-]+$/;
        if (!hostRegex.test(hostStr)) {
          return res.status(400).json({
            success: false,
            error: 'SMTP Host এর মান সঠিক নয় (যেমন: smtp.gmail.com)।',
            field: 'smtpHost',
          });
        }
        smtpHost = hostStr;
      } else {
        smtpHost = 'smtp.gmail.com';
      }
    }

    // 5. Validate SMTP Port
    let smtpPort: number | undefined = undefined;
    if (body.smtpPort !== undefined && body.smtpPort !== null && body.smtpPort !== '') {
      const portNum = Number(body.smtpPort);
      if (isNaN(portNum) || !Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
        return res.status(400).json({
          success: false,
          error: 'SMTP Port ১ থেকে ৬৫৫৩৫ এর মধ্যে একটি বৈধ পূর্ণসংখ্যা হতে হবে (যেমন: 465 বা 587)।',
          field: 'smtpPort',
        });
      }
      smtpPort = portNum;
    } else if (body.smtpPort === '') {
      smtpPort = 465;
    }

    // 6. Validate & Normalize App Password (smtpPass)
    let finalSmtpPass = data.settings.smtpPass;
    if (body.clearSmtpPass === true) {
      finalSmtpPass = undefined;
    } else if (typeof body.smtpPass === 'string' && body.smtpPass.trim() !== '') {
      // Remove spaces between 4-char groups (e.g. 'xxxx xxxx xxxx xxxx' -> 'xxxxxxxxxxxxxxxx')
      const cleanPass = body.smtpPass.replace(/\s+/g, '');
      if (cleanPass.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Google App Password কমপক্ষে ৮ অক্ষরের (সাধারণত ১৬-ডিজিটের) হতে হবে।',
          field: 'smtpPass',
        });
      }
      finalSmtpPass = cleanPass;
    }

    // 7. Coherency Check: if smtpUser provided without any password
    if (smtpUser && !finalSmtpPass && !process.env.SMTP_PASS && !process.env.GMAIL_APP_PASSWORD) {
      return res.status(400).json({
        success: false,
        error: 'প্রেরক Gmail আইডির সাথে ১৬-ডিজিটের Google App Password প্রদান করা আবশ্যক।',
        field: 'smtpPass',
      });
    }

    // 8. Construct sanitized updated settings
    const cleanBody = { ...body };
    if (!cleanBody.smtpPass || typeof cleanBody.smtpPass !== 'string' || !cleanBody.smtpPass.trim()) {
      delete cleanBody.smtpPass;
    }

    const updatedSettings: StoreSettings = {
      ...data.settings,
      ...cleanBody,
      ...(adminEmail !== undefined ? { adminNotificationEmail: adminEmail } : {}),
      ...(smtpUser !== undefined ? { smtpUser: smtpUser } : {}),
      ...(smtpHost !== undefined ? { smtpHost: smtpHost } : {}),
      ...(smtpPort !== undefined ? { smtpPort: smtpPort } : {}),
    };

    if (finalSmtpPass) {
      updatedSettings.smtpPass = finalSmtpPass;
    } else if (body.clearSmtpPass === true) {
      delete updatedSettings.smtpPass;
    }

    data.settings = updatedSettings;
    const saveSuccess = dbInstance.save();
    if (!saveSuccess) {
      return res.status(500).json({
        success: false,
        error: 'ডেটাবেস ফাইলে সেটিংস সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে সার্ভার ফাইল পারমিশন পরীক্ষা করুন।',
      });
    }

    console.log('[Admin Settings] Successfully updated and persisted store settings to db.json');

    // Safe settings response without raw password
    const safeResponseSettings: StoreSettings = {
      ...data.settings,
      smtpPass: '',
      hasSmtpPass: Boolean(data.settings.smtpPass),
    };

    res.json({
      success: true,
      settings: safeResponseSettings,
      message: 'সেটিংস সফলভাবে ডেটাবেসে সংরক্ষিত হয়েছে।',
    });
  } catch (err: any) {
    console.error('[Admin Settings ERROR]', err?.message || 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'সার্ভারে অভ্যন্তরীণ ত্রুটি ঘটেছে: ' + (err?.message || 'অজানা ত্রুটি'),
    });
  }
});

// Change Admin Password
app.put('/api/admin/password', requireAdmin, (req: Request, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
  }

  dbInstance.updateAdminPassword(newPassword);
  res.json({ success: true, message: 'অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।' });
});

// Reviews Moderation
app.get('/api/admin/reviews', requireAdmin, (req: Request, res: Response) => {
  const data = dbInstance.getData();
  res.json({ reviews: data.reviews });
});

app.patch('/api/admin/reviews/:id/approve', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbInstance.getData();
  const review = data.reviews.find(r => r.id === id);
  if (!review) return res.status(404).json({ error: 'রিভিউ পাওয়া যায়নি।' });

  review.isApproved = !review.isApproved;
  dbInstance.save();
  res.json({ success: true, review });
});

app.delete('/api/admin/reviews/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbInstance.getData();
  data.reviews = data.reviews.filter(r => r.id !== id);
  dbInstance.save();
  res.json({ success: true, message: 'রিভিউ মুছে ফেলা হয়েছে।' });
});

// Full Store Data Export (One-Click JSON Backup)
app.get('/api/admin/export', requireAdmin, (req: Request, res: Response) => {
  const data = dbInstance.getData();
  const safeExport = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    storeName: data.settings.storeName,
    products: data.products,
    categories: data.categories,
    settings: {
      ...data.settings,
      smtpPass: data.settings.smtpPass ? '***MASKED***' : '',
    },
    deliveryZones: data.deliveryZones,
    coupons: data.coupons,
    orders: data.orders,
  };
  res.json({ success: true, data: safeExport });
});

// Full Store Data Restore / Cloud Sync
app.post('/api/admin/restore', requireAdmin, (req: Request, res: Response) => {
  try {
    const { data: restoreData } = req.body;
    if (!restoreData || !Array.isArray(restoreData.products)) {
      return res.status(400).json({ error: 'সঠিক ব্যাকআপ ডেটা ফরম্যাট পাওয়া যায়নি।' });
    }
    const ok = dbInstance.restoreFromData(restoreData);
    if (!ok) {
      return res.status(500).json({ error: 'ডেটাবেসে ব্যাকআপ রিস্টোর ব্যর্থ হয়েছে।' });
    }
    console.log(`[Admin Restore] Successfully restored ${restoreData.products.length} products to database`);
    res.json({ success: true, message: `${restoreData.products.length} টি পণ্য ও সেটিংস সফলভাবে রিস্টোর হয়েছে!` });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ error: 'রিস্টোর প্রক্রিয়ায় ত্রুটি ঘটেছে।' });
  }
});

// ==========================================
// 3. VITE INTEGRATION FOR FULL-STACK
// ==========================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function startServer() {
  let vite: any = null;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // Handle dynamic OpenGraph & SEO metadata for /product/:slugOrId
  app.get('/product/:slugOrId', async (req: Request, res: Response, next: NextFunction) => {
    // Only intercept HTML navigation requests (or crawlers without accept header)
    const acceptHeader = req.headers.accept || '';
    if (!acceptHeader.includes('text/html') && !acceptHeader.includes('*/*') && req.path.includes('.')) {
      return next();
    }

    try {
      const data = dbInstance.getData();
      const { slugOrId } = req.params;
      const product = data.products.find(p => (p.id === slugOrId || p.slug === slugOrId) && p.isPublished);

      const indexPath = isProd
        ? path.resolve(process.cwd(), 'dist', 'index.html')
        : path.resolve(process.cwd(), 'index.html');

      if (!fs.existsSync(indexPath)) {
        return next();
      }

      let html = fs.readFileSync(indexPath, 'utf-8');

      if (product) {
        const currentPrice = product.salePrice ?? product.regularPrice;
        const pageTitle = `${product.name} (৳${currentPrice.toLocaleString('bn-BD')}) | ZX Shop`;
        const rawDesc = (product.description || '').replace(/\s+/g, ' ').trim();
        const pageDesc = rawDesc.slice(0, 155) + (rawDesc.length > 155 ? '...' : '');

        const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
        const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || `localhost:${PORT}`;
        const canonicalUrl = `${protocol}://${host}/product/${product.slug || product.id}`;

        let imageUrl = product.mainImage || (product.images && product.images[0]) || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${protocol}://${host}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }

        // Replace Title & Description in HTML
        html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
        html = html.replace(
          /<meta name="description" content=".*?" \/>/i,
          `<meta name="description" content="${escapeHtml(pageDesc)}" />`
        );
        html = html.replace(
          /<meta property="og:title" content=".*?" \/>/i,
          `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`
        );
        html = html.replace(
          /<meta property="og:description" content=".*?" \/>/i,
          `<meta property="og:description" content="${escapeHtml(pageDesc)}" />`
        );
        html = html.replace(
          /<meta name="twitter:title" content=".*?" \/>/i,
          `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`
        );
        html = html.replace(
          /<meta name="twitter:description" content=".*?" \/>/i,
          `<meta name="twitter:description" content="${escapeHtml(pageDesc)}" />`
        );

        const injectedOgTags = `
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:alt" content="${escapeHtml(product.name)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta property="product:price:amount" content="${currentPrice}" />
    <meta property="product:price:currency" content="BDT" />
        `;
        html = html.replace('</head>', `${injectedOgTags}\n  </head>`);
      }

      if (!isProd && vite) {
        html = await vite.transformIndexHtml(req.originalUrl, html);
      }

      // Always return 200 HTML so the client-side SPA router can gracefully display the product or not-found UI
      res.status(200).send(html);
    } catch (err) {
      next(err);
    }
  });

  if (!isProd && vite) {
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ZX Shop server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
