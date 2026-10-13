import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Product, Order, Category, DeliveryZone, Coupon, OrderStatus, PaymentStatus } from '../types/ecommerce';
import { handleImageError, getProductImageUrl, FALLBACK_PRODUCT_IMAGE } from '../utils/imageUtils';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Truck,
  Tag,
  Settings,
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  Download,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Check,
  User,
  Lock,
  Camera,
  X,
  FileCheck,
  Send,
  Mail,
  SendHorizontal,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { showToast, reloadBootstrap } = useShop();

  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('zx_admin_token'));
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'orders' | 'categories' | 'delivery' | 'coupons' | 'settings'
  >('dashboard');

  // Dashboard Stats
  const [stats, setStats] = useState<any>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Product form state
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('cat-1');
  const [formDesc, setFormDesc] = useState('');
  const [formRegularPrice, setFormRegularPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStock, setFormStock] = useState('20');
  const [formMainImage, setFormMainImage] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formVariantsStr, setFormVariantsStr] = useState(''); // e.g. সাইজ: M, L, XL
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');

  // Delivery zones state
  const [zones, setZones] = useState<DeliveryZone[]>([]);

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'fixed' | 'percentage'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('10');
  const [newCouponMin, setNewCouponMin] = useState('1000');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<any>(null);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(null);

  // Gmail SMTP & Email state
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isResendingOrderEmail, setIsResendingOrderEmail] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpSaveError, setSmtpSaveError] = useState<string | null>(null);
  const [smtpSaveSuccess, setSmtpSaveSuccess] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Fetch helpers with auth headers and 401 session expiry handling
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      localStorage.removeItem('zx_admin_token');
      setToken(null);
      setAuthError('আপনার অ্যাডমিন সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।');
      showToast('লগইন সেশন মেয়াদোত্তীর্ণ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।', 'error');
    }
    return res;
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('zx_admin_token', data.token);
        setToken(data.token);
        showToast(data.message, 'success');
      } else {
        setAuthError(data.error || 'ভুল ইউজারনেম অথবা পাসওয়ার্ড।');
      }
    } catch {
      setAuthError('সার্ভার যোগাযোগে সমস্যা হয়েছে।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authFetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('zx_admin_token');
    setToken(null);
    showToast('অ্যাডমিন প্যানেল থেকে লগআউট করা হয়েছে।', 'info');
  };

  // Load Data
  const loadDashboardData = async () => {
    if (!token) return;
    try {
      const [statsRes, prodRes, ordRes, bootRes, emailRes, settingsRes] = await Promise.all([
        authFetch('/api/admin/stats'),
        authFetch('/api/admin/products'),
        authFetch('/api/admin/orders'),
        fetch('/api/bootstrap'),
        authFetch('/api/admin/email-status'),
        authFetch('/api/admin/settings'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || []);
      }
      if (bootRes.ok) {
        const bootData = await bootRes.json();
        setCategories(bootData.categories || []);
        setZones(bootData.deliveryZones || []);
        if (!settingsRes.ok) {
          setSettingsForm(bootData.settings || null);
        }
      }
      if (settingsRes && settingsRes.ok) {
        const adminSettingsData = await settingsRes.json();
        setSettingsForm(adminSettingsData.settings || null);
      }
      if (emailRes && emailRes.ok) {
        setEmailStatus(await emailRes.json());
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      const res = await authFetch('/api/admin/test-email', {
        method: 'POST',
        body: JSON.stringify({ recipient: settingsForm?.adminNotificationEmail || 'mdmohammad.644633815@gmail.com' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'টেস্ট ইমেইল সফলভাবে পাঠানো হয়েছে!', 'success');
        const st = await authFetch('/api/admin/email-status');
        if (st.ok) setEmailStatus(await st.json());
      } else {
        showToast(data.error || 'টেস্ট ইমেইল পাঠানো ব্যর্থ হয়েছে।', 'error');
      }
    } catch {
      showToast('সার্ভার যোগাযোগে ত্রুটি ঘটেছে।', 'error');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleResendOrderEmail = async (orderId: string) => {
    setIsResendingOrderEmail(true);
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/resend-email`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('অর্ডার নোটিফিকেশন ইমেইল সফলভাবে পাঠানো হয়েছে!', 'success');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, emailNotificationStatus: 'sent', emailSentAt: new Date().toISOString() } : o));
        if (viewingOrder && viewingOrder.id === orderId) {
          setViewingOrder(prev => prev ? { ...prev, emailNotificationStatus: 'sent', emailSentAt: new Date().toISOString() } : null);
        }
      } else {
        showToast(data.error || 'ইমেইল পাঠানো ব্যর্থ হয়েছে।', 'error');
      }
    } catch {
      showToast('সার্ভারে যোগাযোগ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsResendingOrderEmail(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await authFetch('/api/admin/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'ডেটাবেস ব্যাকআপ সফলভাবে তৈরি হয়েছে!', 'success');
      } else {
        showToast(data.error || 'ব্যাকআপ তৈরি করা যায়নি।', 'error');
      }
    } catch {
      showToast('সার্ভার যোগাযোগে ত্রুটি ঘটেছে।', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Download entire database as a JSON file for 100% offline security & backup
  const handleDownloadJsonBackup = async () => {
    try {
      const res = await authFetch('/api/admin/export');
      const json = await res.json();
      if (res.ok && json.data) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `zx_shop_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        showToast('দোকানের সম্পূর্ণ ডেটাবেস JSON ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে!', 'success');
      } else {
        showToast('ব্যাকআপ ফাইল তৈরি করতে ব্যর্থ হয়েছে।', 'error');
      }
    } catch {
      showToast('সার্ভার যোগাযোগে ত্রুটি ঘটেছে।', 'error');
    }
  };

  // Restore entire database from a previously downloaded JSON file
  const handleRestoreJsonBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || !Array.isArray(parsed.products)) {
        showToast('ভুল ফাইল ফরম্যাট! এটি একটি সঠিক ZX Shop ব্যাকআপ ফাইল নয়।', 'error');
        return;
      }

      if (!window.confirm(`আপনি কি নিশ্চিত যে এই ব্যাকআপ ফাইলটি রিস্টোর করতে চান? এতে ${parsed.products.length} টি পণ্য এবং সেটিংস লোড হবে।`)) {
        return;
      }

      const res = await authFetch('/api/admin/restore', {
        method: 'POST',
        body: JSON.stringify({ data: parsed }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(resData.message || 'ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!', 'success');
        loadDashboardData();
        reloadBootstrap();
      } else {
        showToast(resData.error || 'রিস্টোর করতে সমস্যা হয়েছে।', 'error');
      }
    } catch (err) {
      showToast('ফাইল পড়তে সমস্যা হয়েছে। সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।', 'error');
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, activeTab]);

  // Multiple Image Upload Handler (Camera & Gallery friendly)
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    const fileList = Array.from(files);

    try {
      let uploadCount = 0;
      for (const file of fileList) {
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = async () => {
            try {
              const base64 = reader.result as string;
              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, base64 }),
              });
              const data = await res.json();
              if (res.ok && data.url) {
                setFormImages(prev => {
                  const updated = [...prev, data.url];
                  setFormMainImage(curr => (curr ? curr : data.url));
                  return updated;
                });
                uploadCount++;
              }
            } catch (err) {
              console.error('File upload failed:', err);
            }
            resolve(true);
          };
          reader.readAsDataURL(file);
        });
      }

      if (uploadCount > 0) {
        showToast(`${uploadCount} টি ছবি সফলভাবে আপলোড হয়েছে!`, 'success');
      } else {
        showToast('ছবি আপলোড সম্পন্ন হয়নি।', 'error');
      }
    } catch {
      showToast('ছবি প্রক্রিয়া করতে ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsUploadingImage(false);
      // Reset input value to allow selecting same files again
      e.target.value = '';
    }
  };

  const handleAddCustomImageUrl = () => {
    if (!customImageUrl.trim()) return;
    const url = customImageUrl.trim();
    setFormImages(prev => [...prev, url]);
    setFormMainImage(curr => (curr ? curr : url));
    setCustomImageUrl('');
    showToast('ছবির লিংক যুক্ত করা হয়েছে!', 'success');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const targetImage = formImages[indexToRemove];
    const updated = formImages.filter((_, idx) => idx !== indexToRemove);
    setFormImages(updated);
    if (formMainImage === targetImage) {
      setFormMainImage(updated[0] || '');
    }
  };

  // Open Product Modal
  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`ZX-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory(categories[0]?.id || 'cat-1');
    setFormDesc('');
    setFormRegularPrice('');
    setFormSalePrice('');
    setFormStock('20');
    setFormMainImage('');
    setFormImages([]);
    setFormVariantsStr('');
    setFormIsFeatured(false);
    setFormIsPopular(false);
    setFormIsPublished(true);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSku(prod.sku);
    setFormCategory(prod.category);
    setFormDesc(prod.description);
    setFormRegularPrice(prod.regularPrice.toString());
    setFormSalePrice(prod.salePrice ? prod.salePrice.toString() : '');
    setFormStock(prod.stock.toString());
    setFormMainImage(prod.mainImage);
    setFormImages(prod.images || [prod.mainImage]);
    const vStr = prod.variants?.map(v => `${v.name}: ${v.options.join(', ')}`).join('\n') || '';
    setFormVariantsStr(vStr);
    setFormIsFeatured(prod.isFeatured);
    setFormIsPopular(prod.isPopular);
    setFormIsPublished(prod.isPublished);
    setIsProductModalOpen(true);
  };

  // Save Product (Draft or Published)
  const handleSaveProduct = async (shouldPublish: boolean) => {
    if (!formName.trim()) {
      showToast('অনুগ্রহ করে পণ্যের নাম লিখুন।', 'error');
      return;
    }
    if (!formRegularPrice || isNaN(Number(formRegularPrice)) || Number(formRegularPrice) <= 0) {
      showToast('অনুগ্রহ করে পণ্যের সঠিক নিয়মিত মূল্য (৳) দিন।', 'error');
      return;
    }

    // Parse variants string
    const parsedVariants: any[] = [];
    if (formVariantsStr.trim()) {
      const lines = formVariantsStr.split('\n');
      lines.forEach((line, idx) => {
        const parts = line.split(':');
        if (parts.length === 2) {
          const vName = parts[0].trim();
          const vOpts = parts[1].split(',').map(s => s.trim()).filter(Boolean);
          if (vName && vOpts.length) {
            parsedVariants.push({ id: `v-${idx}`, name: vName, options: vOpts });
          }
        }
      });
    }

    const mainImg = formMainImage || (formImages.length > 0 ? formImages[0] : FALLBACK_PRODUCT_IMAGE);

    const payload = {
      name: formName.trim(),
      sku: formSku.trim(),
      category: formCategory,
      description: formDesc.trim(),
      regularPrice: Number(formRegularPrice),
      salePrice: formSalePrice ? Number(formSalePrice) : undefined,
      stock: Number(formStock) || 0,
      mainImage: mainImg,
      images: formImages.length ? formImages : [mainImg],
      variants: parsedVariants,
      isFeatured: formIsFeatured,
      isPopular: formIsPopular,
      isPublished: shouldPublish,
    };

    try {
      let res;
      if (editingProduct) {
        res = await authFetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await authFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          shouldPublish
            ? 'পণ্যটি সফলভাবে Publish করা হয়েছে এবং শপে দেখা যাচ্ছে!'
            : 'পণ্যটি সফলভাবে Draft হিসেবে সংরক্ষণ করা হয়েছে।',
          'success'
        );
        setIsProductModalOpen(false);
        loadDashboardData();
        reloadBootstrap();
      } else {
        showToast(data.error || 'পণ্য সংরক্ষণ করা যায়নি।', 'error');
      }
    } catch {
      showToast('সার্ভার সমস্যা, আবার চেষ্টা করুন।', 'error');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে পণ্যটি মুছে ফেলতে চান?')) return;
    try {
      const res = await authFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।', 'success');
        loadDashboardData();
        reloadBootstrap();
      }
    } catch {
      showToast('পণ্যটি মুছতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Duplicate product
  const handleDuplicateProduct = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/products/duplicate/${id}`, { method: 'POST' });
      if (res.ok) {
        showToast('পণ্যটির ডুপ্লিকেট কপি তৈরি হয়েছে!', 'success');
        loadDashboardData();
        reloadBootstrap();
      }
    } catch {
      showToast('পণ্য কপি করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Toggle publish
  const handleTogglePublish = async (prod: Product) => {
    try {
      const res = await authFetch(`/api/admin/products/${prod.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !prod.isPublished }),
      });
      if (res.ok) {
        showToast(prod.isPublished ? 'পণ্যটি Unpublish করা হয়েছে।' : 'পণ্যটি Publish করা হয়েছে!', 'info');
        loadDashboardData();
        reloadBootstrap();
      }
    } catch {
      showToast('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Bulk action
  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedProductIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`আপনি কি নিশ্চিত যে নির্বাচিত ${selectedProductIds.length} টি পণ্য মুছে ফেলবেন?`)) {
      return;
    }

    try {
      const res = await authFetch('/api/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ action, ids: selectedProductIds }),
      });
      if (res.ok) {
        showToast('বাল্ক অ্যাকশন সফল হয়েছে!', 'success');
        setSelectedProductIds([]);
        loadDashboardData();
        reloadBootstrap();
      }
    } catch {
      showToast('অপারেশন ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast('অর্ডারের অবস্থা সফলভাবে আপডেট হয়েছে!', 'success');
        loadDashboardData();
        if (viewingOrder && viewingOrder.id === orderId) {
          const updated = await res.json();
          setViewingOrder(updated.order);
        }
      }
    } catch {
      showToast('অর্ডার আপডেট করা যায়নি।', 'error');
    }
  };

  // Verify payment
  const handleVerifyPayment = async (orderId: string, currentStatus: PaymentStatus) => {
    const nextStatus = currentStatus === 'verified' ? 'pending' : 'verified';
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
      if (res.ok) {
        showToast(nextStatus === 'verified' ? 'পেমেন্ট ভেরিফাই করা হয়েছে!' : 'পেমেন্ট পেন্ডিং করা হয়েছে।', 'success');
        loadDashboardData();
      }
    } catch {
      showToast('পেমেন্ট স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast('এক্সপোর্ট করার মতো কোনো অর্ডার নেই।', 'info');
      return;
    }

    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Address', 'Total Amount', 'Payment Method', 'TrxID', 'Order Status'];
    const rows = orders.map(o => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customer.fullName.replace(/"/g, '""')}"`,
      `"${o.customer.phone}"`,
      `"${o.customer.fullAddress.replace(/"/g, '""')}"`,
      o.totalAmount,
      o.paymentMethod,
      o.transactionId || '',
      o.orderStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ZX_Shop_Orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('অর্ডার তালিকা CSV ডাউনলোড হয়েছে!', 'success');
  };

  // Add category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await authFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim(), banglaName: newCatName.trim() }),
      });
      if (res.ok) {
        showToast('নতুন ক্যাটাগরি তৈরি হয়েছে!', 'success');
        setNewCatName('');
        loadDashboardData();
        reloadBootstrap();
      }
    } catch {
      showToast('ক্যাটাগরি তৈরি করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Update General Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;

    setIsSavingSettings(true);
    setSettingsSaveError(null);

    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'দোকানের সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
        if (data.settings) setSettingsForm(data.settings);
        reloadBootstrap();
      } else {
        const errorMsg = data?.error || 'দোকানের সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে।';
        setSettingsSaveError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch {
      const netError = 'সার্ভার যোগাযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      setSettingsSaveError(netError);
      showToast(netError, 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Update Gmail SMTP Settings with Real Validation & Error Handling
  const handleSaveSmtpSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settingsForm) return;

    setIsSavingSmtp(true);
    setSmtpSaveError(null);
    setSmtpSaveSuccess(null);

    const adminEmail = (settingsForm.adminNotificationEmail || '').trim();
    if (adminEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminEmail)) {
        setSmtpSaveError('সঠিক অ্যাডমিন নোটিফিকেশন ইমেইল লিখুন (যেমন: mdmohammad.644633815@gmail.com)।');
        setIsSavingSmtp(false);
        return;
      }
    }

    const smtpUser = (settingsForm.smtpUser || '').trim();
    if (smtpUser) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(smtpUser)) {
        setSmtpSaveError('প্রেরক Gmail আইডি (SMTP User) একটি সঠিক ইমেইল হতে হবে (যেমন: yourstore@gmail.com)।');
        setIsSavingSmtp(false);
        return;
      }
    }

    const portNum = Number(settingsForm.smtpPort);
    if (settingsForm.smtpPort !== undefined && settingsForm.smtpPort !== '' && (isNaN(portNum) || portNum < 1 || portNum > 65535)) {
      setSmtpSaveError('SMTP Port ১ থেকে ৬৫৫৩৫ এর মধ্যে একটি বৈধ সংখ্যা হতে হবে (যেমন: 465 বা 587)।');
      setIsSavingSmtp(false);
      return;
    }

    const rawPass = (settingsForm.smtpPass || '').trim();
    const passClean = rawPass.replace(/\s+/g, '');
    if (rawPass && passClean.length < 8) {
      setSmtpSaveError('Google App Password কমপক্ষে ৮ অক্ষরের (সাধারণত ১৬-ডিজিটের) হতে হবে।');
      setIsSavingSmtp(false);
      return;
    }

    try {
      const payload: any = {
        ...settingsForm,
        adminNotificationEmail: adminEmail || 'mdmohammad.644633815@gmail.com',
        smtpUser: smtpUser,
        smtpHost: (settingsForm.smtpHost || 'smtp.gmail.com').trim(),
        smtpPort: portNum || 465,
      };

      if (passClean) {
        payload.smtpPass = passClean;
      }

      const res = await authFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const okMsg = 'Gmail SMTP সেটিংস ডেটাবেসে সফলভাবে সংরক্ষিত হয়েছে!';
        setSmtpSaveSuccess(okMsg);
        showToast(okMsg, 'success');
        if (data.settings) setSettingsForm(data.settings);

        // Instantly refresh email service status
        const st = await authFetch('/api/admin/email-status');
        if (st.ok) setEmailStatus(await st.json());
      } else {
        const errorMsg = data?.error || 'Gmail SMTP সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।';
        setSmtpSaveError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch {
      const netError = 'সার্ভার যোগাযোগে ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      setSmtpSaveError(netError);
      showToast(netError, 'error');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  // Update Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPass || newAdminPass.length < 6) {
      showToast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 'error');
      return;
    }

    try {
      const res = await authFetch('/api/admin/password', {
        method: 'PUT',
        body: JSON.stringify({ newPassword: newAdminPass }),
      });
      if (res.ok) {
        showToast('অ্যাডমিন পাসওয়ার্ড পরিবর্তিত হয়েছে!', 'success');
        setNewAdminPass('');
      }
    } catch {
      showToast('পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।', 'error');
    }
  };

  // -------------------------------------------------------------
  // If NOT Logged In: Render Login Screen
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-3 sm:px-4 py-12 sm:py-16">
        <div className="clay-card p-6 sm:p-8 bg-white space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              অ্যাডমিন লগইন
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ZX Shop ম্যানেজমেন্ট ড্যাশবোর্ডে প্রবেশ করুন
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ইউজারনেম (Username):</label>
              <div className="clay-inset px-3.5 py-2 flex items-center">
                <User className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full bg-transparent text-slate-800 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">পাসওয়ার্ড (Password):</label>
              <div className="clay-inset px-3.5 py-2 flex items-center">
                <Lock className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full bg-transparent text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full clay-btn-primary py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-md cursor-pointer"
            >
              {isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>

          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-100 space-y-1">
            <p className="font-bold text-slate-700">ডিফল্ট ক্রডেনশিয়াল:</p>
            <p>ইউজারনেম: <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-600 font-mono">admin</code></p>
            <p>পাসওয়ার্ড: <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-600 font-mono">admin123</code></p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // If Logged In: Render Full Admin Dashboard
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Admin Header Bar */}
      <div className="clay-card-flat p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md">
            ZX
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              ZX Shop অ্যাডমিন কন্ট্রোল
            </h1>
            <span className="text-[11px] text-emerald-600 font-bold block mt-1">
              সক্রিয় সেশন (অ্যাডমিনিস্ট্রেটর)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            onClick={openNewProductModal}
            className="flex-1 sm:flex-none clay-btn-primary px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পণ্য যোগ করুন</span>
          </button>

          <button
            onClick={handleLogout}
            className="clay-btn-secondary px-3 py-2 sm:py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            title="লগআউট"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Smooth horizontal clay scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
          { id: 'products', label: 'পণ্য তালিকা', icon: Package },
          { id: 'orders', label: 'অর্ডার ও পেমেন্ট', icon: ShoppingBag },
          { id: 'categories', label: 'ক্যাটাগরি', icon: Layers },
          { id: 'delivery', label: 'ডেলিভারি চার্জ', icon: Truck },
          { id: 'coupons', label: 'কুপন ও ছাড়', icon: Tag },
          { id: 'settings', label: 'দোকান সেটিংস', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'clay-btn-primary shadow-sm'
                  : 'clay-btn-secondary text-slate-700 hover:text-rose-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          TAB 1: DASHBOARD
      ======================================================== */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6 sm:space-y-8">
          {/* Top Counters Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="clay-card-peach p-4 sm:p-5">
              <span className="text-[11px] font-bold text-orange-900/70 uppercase tracking-wider block mb-1">
                মোট বিক্রয় রাজস্ব
              </span>
              <span className="text-xl sm:text-3xl font-black text-rose-600 num-bn">
                ৳{stats.totalRevenue.toLocaleString('bn-BD')}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">সম্পন্ন ডেলিভারি থেকে</span>
            </div>

            <div className="clay-card-skyblue p-4 sm:p-5">
              <span className="text-[11px] font-bold text-sky-900/70 uppercase tracking-wider block mb-1">
                সর্বমোট অর্ডার
              </span>
              <span className="text-xl sm:text-3xl font-black text-slate-900 num-bn">
                {stats.totalOrders} টি
              </span>
              <span className="text-[10px] text-sky-700 font-bold mt-1 block">
                নতুন/পেন্ডিং: {stats.pendingOrders} টি
              </span>
            </div>

            <div className="clay-card-mint p-4 sm:p-5">
              <span className="text-[11px] font-bold text-emerald-900/70 uppercase tracking-wider block mb-1">
                মোট পণ্য সংখ্যা
              </span>
              <span className="text-xl sm:text-3xl font-black text-slate-900 num-bn">
                {stats.totalProducts} টি
              </span>
              <span className="text-[10px] text-emerald-700 font-medium mt-1 block">সকল কালেকশন মিলিয়ে</span>
            </div>

            <div className="clay-card-lavender p-4 sm:p-5">
              <span className="text-[11px] font-bold text-purple-900/70 uppercase tracking-wider block mb-1">
                কম স্টক অ্যালার্ট
              </span>
              <span className="text-xl sm:text-3xl font-black text-purple-700 num-bn">
                {stats.lowStockCount} টি
              </span>
              <span className="text-[10px] text-purple-600 font-medium mt-1 block">স্টক ৫ টির কম রয়েছে</span>
            </div>
          </div>

          {/* Low Stock Warning Box */}
          {stats.lowStockProducts?.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>সতর্কতা: নিচের পণ্যগুলোর স্টক শীঘ্রই শেষ হতে চলেছে</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {stats.lowStockProducts.map((p: any) => (
                  <span key={p.id} className="bg-white px-2.5 py-1 rounded-lg border border-amber-200 font-semibold text-[11px]">
                    {p.name} (বাকি: {p.stock} টি)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders Overview */}
          <div className="clay-card p-5 sm:p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                সাম্প্রতিক অর্ডার সমূহ
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                সকল অর্ডার দেখুন
              </button>
            </div>

            {stats.recentOrders?.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">এখনও কোনো অর্ডার আসেনি।</p>
            ) : (
              <div className="space-y-2.5">
                {stats.recentOrders?.map((ord: Order) => (
                  <div key={ord.id} className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-slate-900 font-mono block">
                        {ord.orderNumber}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {ord.customer.fullName} · {ord.customer.phone}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600 block num-bn">
                        ৳{ord.totalAmount.toLocaleString('bn-BD')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">
                        {ord.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: PRODUCT MANAGEMENT (Mobile Cards & Desktop Table)
      ======================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Search, Filter & Bulk bar */}
          <div className="clay-card-flat p-3 sm:p-4 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="clay-inset px-3 py-1.5 flex items-center flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="নাম বা SKU দিয়ে ফিল্টার করুন..."
                className="bg-transparent text-xs text-slate-800 w-full focus:outline-none"
              />
            </div>

            {/* Bulk actions */}
            {selectedProductIds.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                  নির্বাচিত ({selectedProductIds.length}):
                </span>
                <button
                  onClick={() => handleBulkAction('publish')}
                  className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkAction('unpublish')}
                  className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Unpublish
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-2 py-1 bg-rose-100 text-rose-800 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Delete
                </button>
              </div>
            )}

            <button
              onClick={openNewProductModal}
              className="clay-btn-primary px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন পণ্য যোগ করুন</span>
            </button>
          </div>

          {/* Mobile Product Cards (sm:hidden) */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {products
              .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
              .map(p => (
                <div key={p.id} className="clay-card p-3.5 bg-white space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={getProductImageUrl(p.mainImage || p.images?.[0])}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-600 font-mono">{p.sku}</span>
                        <button
                          onClick={() => handleTogglePublish(p)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                            p.isPublished
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {p.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-rose-600 num-bn">
                          ৳{(p.salePrice ?? p.regularPrice).toLocaleString('bn-BD')}
                        </span>
                        <span className={`text-[11px] font-bold num-bn ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-600'}`}>
                          স্টক: {p.stock} টি
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditProductModal(p)}
                      className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>সম্পাদনা</span>
                    </button>
                    <button
                      onClick={() => handleDuplicateProduct(p.id)}
                      className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>কপি</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop Products Table (hidden on mobile, visible on sm and above) */}
          <div className="hidden sm:block clay-card bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === products.length && products.length > 0}
                        onChange={e => {
                          if (e.target.checked) setSelectedProductIds(products.map(p => p.id));
                          else setSelectedProductIds([]);
                        }}
                      />
                    </th>
                    <th className="p-3">পণ্য</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">মূল্য</th>
                    <th className="p-3">স্টক</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products
                    .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                    .map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(p.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedProductIds(prev => [...prev, p.id]);
                              else setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 shrink-0 p-0.5 flex items-center justify-center overflow-hidden">
                              <img
                                src={getProductImageUrl(p.mainImage || p.images?.[0])}
                                alt={p.name}
                                className="max-h-full max-w-full object-contain"
                                onError={handleImageError}
                              />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block line-clamp-1">{p.name}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                {p.isFeatured && <span className="text-rose-600 font-bold">Featured</span>}
                                {p.isPopular && <span className="text-amber-600 font-bold">Popular</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-600">{p.sku}</td>
                        <td className="p-3 font-bold text-rose-600 num-bn">
                          ৳{(p.salePrice ?? p.regularPrice).toLocaleString('bn-BD')}
                          {p.salePrice && (
                            <span className="block text-[10px] text-slate-400 line-through">
                              ৳{p.regularPrice.toLocaleString('bn-BD')}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`font-bold num-bn ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {p.stock} টি
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleTogglePublish(p)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                              p.isPublished
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {p.isPublished ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="এডিট করুন"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(p.id)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                              title="ডুপ্লিকেট কপি"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MOBILE-OPTIMIZED PRODUCT UPLOAD / EDIT MODAL
      ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="clay-card p-4 sm:p-7 bg-white max-w-2xl w-full my-4 sm:my-8 space-y-4 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {editingProduct ? 'পণ্য সম্পাদনা (Edit Product)' : 'নতুন পণ্য যোগ করুন'}
                </h2>
                <span className="text-[11px] text-slate-500">
                  মোবাইল ও পিসিতে সহজে ছবি আপলোড ও তথ্য পূরণ করুন
                </span>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
              
              {/* ১. মৌলিক তথ্য */}
              <div className="p-3 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-rose-600" />
                  <span>১. প্রাথমিক তথ্য</span>
                </h3>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">পণ্যের নাম *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="যেমন: প্রিমিয়াম কটন পাঞ্জাবি"
                    className="w-full clay-inset px-3 py-2 text-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">SKU কোড</label>
                    <input
                      type="text"
                      value={formSku}
                      onChange={e => setFormSku(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ক্যাটাগরি নির্বাচন *</label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full clay-inset px-3 py-2 text-slate-800 cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.banglaName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ২. মূল্য ও স্টক */}
              <div className="p-3 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-600" />
                  <span>২. মূল্য ও স্টক তথ্য</span>
                </h3>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">নিয়মিত মূল্য (৳) *</label>
                    <input
                      type="number"
                      required
                      value={formRegularPrice}
                      onChange={e => setFormRegularPrice(e.target.value)}
                      placeholder="২০০০"
                      className="w-full clay-inset px-2.5 py-2 text-slate-800 num-bn"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">অফার মূল্য (৳)</label>
                    <input
                      type="number"
                      value={formSalePrice}
                      onChange={e => setFormSalePrice(e.target.value)}
                      placeholder="১৬৫০"
                      className="w-full clay-inset px-2.5 py-2 text-slate-800 num-bn"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">স্টক পরিমাণ *</label>
                    <input
                      type="number"
                      required
                      value={formStock}
                      onChange={e => setFormStock(e.target.value)}
                      className="w-full clay-inset px-2.5 py-2 text-slate-800 num-bn"
                    />
                  </div>
                </div>
              </div>

              {/* ৩. মোবাইল ক্যামেরা/গ্যালারি থেকে একাধিক ছবি আপলোড */}
              <div className="p-3 sm:p-4 bg-rose-50/30 rounded-2xl border border-rose-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-rose-600" />
                    <span>৩. ছবি আপলোড ও প্রিভিউ (একাধিক ছবি)</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">গ্যালারি/ক্যামেরা থেকে নির্বাচন করুন</span>
                </div>

                {/* Upload Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label className="clay-btn-primary px-4 py-2 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>{isUploadingImage ? 'ছবি আপলোড হচ্ছে...' : 'ছবি নির্বাচন করুন (গ্যালারি/ক্যামেরা)'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={customImageUrl}
                      onChange={e => setCustomImageUrl(e.target.value)}
                      placeholder="অথবা অনলাইন ছবির লিঙ্ক দিন..."
                      className="flex-1 clay-inset px-3 py-1.5 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomImageUrl}
                      className="clay-btn-secondary px-3 py-1.5 text-xs font-bold text-rose-600 cursor-pointer"
                    >
                      যুক্ত
                    </button>
                  </div>
                </div>

                {/* Thumbnails Gallery Management */}
                {formImages.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      আপলোডকৃত ছবিসমূহ (যেকোনো ছবিতে ক্লিক করে প্রধান ছবি নির্ধারণ করুন):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {formImages.map((img, idx) => {
                        const isMain = formMainImage === img;
                        return (
                          <div
                            key={idx}
                            onClick={() => setFormMainImage(img)}
                            className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer aspect-square bg-white p-1 transition-all ${
                              isMain ? 'border-rose-600 ring-2 ring-rose-200 shadow-md' : 'border-slate-200'
                            }`}
                          >
                            <img
                              src={getProductImageUrl(img)}
                              alt={`Upload ${idx}`}
                              className="w-full h-full object-contain rounded-lg p-0.5"
                              onError={handleImageError}
                            />
                            {isMain && (
                              <span className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                প্রধান
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(idx);
                              }}
                              className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white p-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                              title="মুছে ফেলুন"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ৪. ভ্যারিয়েন্ট ও বিবরণ */}
              <div className="p-3 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-600" />
                  <span>৪. ভ্যারিয়েন্ট ও বিবরণ</span>
                </h3>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ভ্যারিয়েন্ট (প্রতি লাইনে ১টি, যেমন: "সাইজ: M, L, XL" অথবা "রং: কালো, নীল"):
                  </label>
                  <textarea
                    rows={2}
                    value={formVariantsStr}
                    onChange={e => setFormVariantsStr(e.target.value)}
                    placeholder="সাইজ: M, L, XL&#10;রং: কালো, নীল"
                    className="w-full clay-inset px-3 py-1.5 text-slate-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">বিস্তারিত বিবরণ</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="পণ্য সম্পর্কে বিস্তারিত লিখুন..."
                    className="w-full clay-inset px-3 py-2 text-slate-800 text-xs"
                  />
                </div>

                {/* Flags */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={e => setFormIsFeatured(e.target.checked)}
                      className="rounded text-rose-600"
                    />
                    <span className="font-bold text-slate-700">Featured Product</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPopular}
                      onChange={e => setFormIsPopular(e.target.checked)}
                      className="rounded text-rose-600"
                    />
                    <span className="font-bold text-slate-700">Popular Product</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Actions: Save Draft & Publish Product */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs order-last sm:order-first cursor-pointer text-center"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                onClick={() => handleSaveProduct(false)}
                className="clay-btn-secondary px-4 py-2.5 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-amber-600" />
                <span>ড্রাফট হিসেবে সংরক্ষণ</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveProduct(true)}
                className="clay-btn-primary px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>পণ্য সরাসরি প্রকাশ করুন (Publish)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: ORDERS & PAYMENT MANAGEMENT (Mobile Cards & Desktop Table)
      ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Filter & Export Bar */}
          <div className="clay-card-flat p-3 sm:p-4 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="clay-inset px-3 py-1.5 flex items-center flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="অর্ডার#, নাম বা ফোন দিয়ে খুঁজুন..."
                  className="bg-transparent text-xs text-slate-800 w-full focus:outline-none"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="clay-inset px-2.5 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <option value="all">সব অবস্থা</option>
                <option value="pending">পেন্ডিং</option>
                <option value="confirmed">কনফার্মড</option>
                <option value="processing">প্রসেসিং</option>
                <option value="shipped">শিপড</option>
                <option value="delivered">ডেলিভারড</option>
                <option value="cancelled">বাতিল</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="clay-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 text-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>CSV ডাউনলোড</span>
            </button>
          </div>

          {/* Orders Mobile Cards (sm:hidden) */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {orders
              .filter(o => {
                if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                if (!orderSearch) return true;
                const q = orderSearch.toLowerCase();
                return o.orderNumber.toLowerCase().includes(q) || o.customer.fullName.toLowerCase().includes(q) || o.customer.phone.includes(q);
              })
              .map(o => (
                <div key={o.id} className="clay-card p-3.5 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-rose-600 font-mono text-xs">{o.orderNumber}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-900 block">{o.customer.fullName}</strong>
                      <span className="text-slate-500 num-bn text-[11px]">{o.customer.phone}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 num-bn block text-sm">
                        ৳{o.totalAmount.toLocaleString('bn-BD')}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {o.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {o.transactionId && (
                    <div className="p-1.5 bg-slate-50 rounded text-[10px] font-mono text-slate-700">
                      TrxID: {o.transactionId}
                    </div>
                  )}

                  {/* Status & Verify in Mobile Card */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <select
                      value={o.orderStatus}
                      onChange={e => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                      className="clay-inset px-2 py-1 text-xs font-bold text-slate-800 rounded-lg cursor-pointer flex-1"
                    >
                      <option value="pending">পেন্ডিং</option>
                      <option value="confirmed">কনফার্মড</option>
                      <option value="processing">প্রসেসিং</option>
                      <option value="shipped">শিপড</option>
                      <option value="delivered">ডেলিভারড</option>
                      <option value="cancelled">বাতিল</option>
                    </select>

                    <button
                      onClick={() => handleVerifyPayment(o.id, o.paymentStatus)}
                      className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${
                        o.paymentStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {o.paymentStatus === 'verified' ? 'Verified' : 'Verify'}
                    </button>

                    <button
                      onClick={() => setViewingOrder(o)}
                      className="clay-btn-secondary px-2.5 py-1 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      রসিদ
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Orders Desktop Table (sm:block) */}
          <div className="hidden sm:block clay-card bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">অর্ডার #</th>
                    <th className="p-3">গ্রাহক</th>
                    <th className="p-3">তারিখ</th>
                    <th className="p-3">মোট টাকা</th>
                    <th className="p-3">পেমেন্ট</th>
                    <th className="p-3">অর্ডারের অবস্থা</th>
                    <th className="p-3 text-right">বিস্তারিত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders
                    .filter(o => {
                      if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                      if (!orderSearch) return true;
                      const q = orderSearch.toLowerCase();
                      return o.orderNumber.toLowerCase().includes(q) || o.customer.fullName.toLowerCase().includes(q) || o.customer.phone.includes(q);
                    })
                    .map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-rose-600">
                          {o.orderNumber}
                        </td>
                        <td className="p-3">
                          <strong className="text-slate-900 block">{o.customer.fullName}</strong>
                          <span className="text-slate-400 num-bn">{o.customer.phone}</span>
                        </td>
                        <td className="p-3 text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString('bn-BD')}
                        </td>
                        <td className="p-3 font-black text-slate-900 num-bn">
                          ৳{o.totalAmount.toLocaleString('bn-BD')}
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-800 uppercase block">
                              {o.paymentMethod}
                            </span>
                            {o.transactionId && (
                              <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700 block">
                                TrxID: {o.transactionId}
                              </span>
                            )}
                            <button
                              onClick={() => handleVerifyPayment(o.id, o.paymentStatus)}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                                o.paymentStatus === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {o.paymentStatus === 'verified' ? 'Verified' : 'Verify Pay'}
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            value={o.orderStatus}
                            onChange={e => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                            className="clay-inset px-2.5 py-1 text-xs font-bold text-slate-800 rounded-lg cursor-pointer"
                          >
                            <option value="pending">পেন্ডিং (গৃহীত)</option>
                            <option value="confirmed">কনফার্মড</option>
                            <option value="processing">প্রসেসিং</option>
                            <option value="shipped">শিপড (পাঠানো)</option>
                            <option value="delivered">ডেলিভারড</option>
                            <option value="cancelled">বাতিল</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setViewingOrder(o)}
                            className="clay-btn-secondary px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
                          >
                            রসিদ দেখুন
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Single Order Detail Modal */}
          {viewingOrder && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="clay-card p-5 sm:p-7 bg-white max-w-lg w-full my-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 font-mono">
                      অর্ডার: {viewingOrder.orderNumber}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      তারিখ: {new Date(viewingOrder.createdAt).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  <button
                    onClick={() => setViewingOrder(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Customer Details */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <p><strong>গ্রাহক:</strong> {viewingOrder.customer.fullName}</p>
                  <p><strong>মোবাইল:</strong> <span className="num-bn">{viewingOrder.customer.phone}</span></p>
                  <p><strong>ঠিকানা:</strong> {viewingOrder.customer.fullAddress}</p>
                  <p><strong>এলাকা:</strong> {viewingOrder.customer.deliveryArea}</p>
                  {viewingOrder.customer.notes && (
                    <p className="text-slate-500 italic"><strong>নোট:</strong> {viewingOrder.customer.notes}</p>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">আইটেম তালিকা:</h4>
                  {viewingOrder.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span>{it.name} (×{it.quantity})</span>
                      <span className="font-bold num-bn">৳{it.total.toLocaleString('bn-BD')}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>সাবটোটাল:</span>
                    <span className="num-bn">৳{viewingOrder.subtotal.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="num-bn">৳{viewingOrder.deliveryCharge.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-100">
                    <span>সর্বমোট বিল:</span>
                    <span className="text-rose-600 num-bn">৳{viewingOrder.totalAmount.toLocaleString('bn-BD')}</span>
                  </div>
                </div>

                {/* Gmail Notification Status & Resend Email */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-rose-600" />
                      <span>Gmail নোটিফিকেশন:</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      viewingOrder.emailNotificationStatus === 'sent' ? 'bg-emerald-100 text-emerald-800' :
                      viewingOrder.emailNotificationStatus === 'failed' ? 'bg-rose-100 text-rose-800' :
                      viewingOrder.emailNotificationStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {viewingOrder.emailNotificationStatus === 'sent' ? '✓ সফলভাবে প্রেরিত' :
                       viewingOrder.emailNotificationStatus === 'failed' ? '✗ ব্যর্থ' :
                       viewingOrder.emailNotificationStatus === 'pending' ? '⏳ প্রসেসিং' : 'কনফিগার নেই'}
                    </span>
                  </div>

                  {viewingOrder.emailSentAt && (
                    <p className="text-[11px] text-slate-500">
                      প্রেরণের সময়: {new Date(viewingOrder.emailSentAt).toLocaleString('bn-BD')}
                    </p>
                  )}

                  {viewingOrder.emailNotificationError && (
                    <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                      ত্রুটি: {viewingOrder.emailNotificationError}
                    </p>
                  )}

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      প্রাপক: mdmohammad.644633815@gmail.com
                    </span>
                    <button
                      type="button"
                      disabled={isResendingOrderEmail}
                      onClick={() => handleResendOrderEmail(viewingOrder.id)}
                      className="clay-btn-secondary px-3 py-1 text-[11px] font-bold text-rose-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <SendHorizontal className="w-3.5 h-3.5" />
                      <span>{isResendingOrderEmail ? 'পাঠানো হচ্ছে...' : 'ইমেইল পুনরায় পাঠান'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => setViewingOrder(null)}
                    className="clay-btn-primary px-5 py-2 text-xs font-bold cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 4: CATEGORIES
      ======================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="clay-card-flat p-4 bg-white flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="নতুন ক্যাটাগরির বাংলা নাম লিখুন..."
              className="clay-inset px-3.5 py-2 text-xs text-slate-800 flex-1 w-full"
            />
            <button
              onClick={handleAddCategory}
              className="clay-btn-primary px-5 py-2 text-xs font-bold shrink-0 w-full sm:w-auto cursor-pointer"
            >
              ক্যাটাগরি যুক্ত করুন
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map(c => (
              <div key={c.id} className="clay-card p-3.5 bg-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{c.banglaName}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{c.slug}</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: DELIVERY ZONES
      ======================================================== */}
      {activeTab === 'delivery' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="clay-card p-5 sm:p-6 bg-white space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">
              এলাকাভিত্তিক ডেলিভারি চার্জ নির্ধারণ
            </h3>

            <div className="space-y-3">
              {zones.map((z, idx) => (
                <div key={z.id} className="p-3.5 bg-slate-50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                  <div className="space-y-0.5">
                    <strong className="text-xs sm:text-sm font-bold text-slate-900 block">{z.name}</strong>
                    <span className="text-slate-500 text-[11px]">আনুমানিক সময়: {z.estimatedDays}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">চার্জ (৳):</span>
                    <input
                      type="number"
                      value={z.rate}
                      onChange={e => {
                        const newRate = Number(e.target.value);
                        setZones(prev => prev.map((item, i) => i === idx ? { ...item, rate: newRate } : item));
                      }}
                      className="clay-inset px-2.5 py-1 w-20 text-slate-900 font-bold num-bn"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={async () => {
                const res = await authFetch('/api/admin/delivery-zones', {
                  method: 'PUT',
                  body: JSON.stringify({ zones }),
                });
                if (res.ok) {
                  showToast('ডেলিভারি চার্জ রেট সফলভাবে সংরক্ষিত হয়েছে!', 'success');
                  reloadBootstrap();
                }
              }}
              className="clay-btn-primary px-5 py-2.5 text-xs font-bold cursor-pointer"
            >
              চার্জ পরিবর্তন সেভ করুন
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: COUPONS
      ======================================================== */}
      {activeTab === 'coupons' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="clay-card-flat p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              নতুন কুপন কোড তৈরি করুন
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                value={newCouponCode}
                onChange={e => setNewCouponCode(e.target.value)}
                placeholder="কুপন কোড (যেমন: ZX20)"
                className="clay-inset px-3 py-1.5 text-xs uppercase text-slate-800"
              />
              <select
                value={newCouponType}
                onChange={e => setNewCouponType(e.target.value as any)}
                className="clay-inset px-3 py-1.5 text-xs text-slate-800"
              >
                <option value="percentage">শতাংশ (%) ছাড়</option>
                <option value="fixed">নির্দিষ্ট টাকা (৳) ছাড়</option>
              </select>
              <input
                type="number"
                value={newCouponValue}
                onChange={e => setNewCouponValue(e.target.value)}
                placeholder="ছাড়ের পরিমাণ"
                className="clay-inset px-3 py-1.5 text-xs text-slate-800 num-bn"
              />
              <input
                type="number"
                value={newCouponMin}
                onChange={e => setNewCouponMin(e.target.value)}
                placeholder="সর্বনিম্ন অর্ডার (৳)"
                className="clay-inset px-3 py-1.5 text-xs text-slate-800 num-bn"
              />
            </div>
            <button
              onClick={async () => {
                if (!newCouponCode.trim() || !newCouponValue) return;
                const res = await authFetch('/api/admin/coupons', {
                  method: 'POST',
                  body: JSON.stringify({
                    code: newCouponCode,
                    discountType: newCouponType,
                    discountValue: newCouponValue,
                    minOrderAmount: newCouponMin,
                  }),
                });
                if (res.ok) {
                  showToast('কুপন সফলভাবে তৈরি হয়েছে!', 'success');
                  setNewCouponCode('');
                }
              }}
              className="clay-btn-primary px-5 py-2 text-xs font-bold cursor-pointer"
            >
              কুপন সংরক্ষণ করুন
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: SETTINGS
      ======================================================== */}
      {activeTab === 'settings' && settingsForm && (
        <div className="space-y-4 sm:space-y-6">
          <form onSubmit={handleSaveSettings} className="clay-card p-5 sm:p-6 bg-white space-y-4 text-xs">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">
              দোকানের মূল তথ্য ও পেমেন্ট সেটিংস
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">দোকানের নাম:</label>
                <input
                  type="text"
                  value={settingsForm.storeName}
                  onChange={e => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  className="w-full clay-inset px-3 py-1.5 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ট্যাগলাইন:</label>
                <input
                  type="text"
                  value={settingsForm.storeTagline}
                  onChange={e => setSettingsForm({ ...settingsForm, storeTagline: e.target.value })}
                  className="w-full clay-inset px-3 py-1.5 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">যোগাযোগ ফোন নম্বর:</label>
                <input
                  type="text"
                  value={settingsForm.contactPhone}
                  onChange={e => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                  className="w-full clay-inset px-3 py-1.5 text-slate-800 num-bn"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp নম্বর:</label>
                <input
                  type="text"
                  value={settingsForm.whatsappNumber}
                  onChange={e => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                  className="w-full clay-inset px-3 py-1.5 text-slate-800 num-bn"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">bKash নম্বর:</label>
                <input
                  type="text"
                  value={settingsForm.bkashNumber}
                  onChange={e => setSettingsForm({ ...settingsForm, bkashNumber: e.target.value })}
                  className="w-full clay-inset px-3 py-1.5 text-slate-800 num-bn"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nagad নম্বর:</label>
                <input
                  type="text"
                  value={settingsForm.nagadNumber}
                  onChange={e => setSettingsForm({ ...settingsForm, nagadNumber: e.target.value })}
                  className="w-full clay-inset px-3 py-1.5 text-slate-800 num-bn"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">দোকানের সম্পূর্ণ ঠিকানা:</label>
              <input
                type="text"
                value={settingsForm.address}
                onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="w-full clay-inset px-3 py-1.5 text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">ফ্রি ডেলিভারি পাওয়ার ন্যূনতম অর্ডার (৳):</label>
              <input
                type="number"
                value={settingsForm.freeDeliveryThreshold}
                onChange={e => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                className="w-full clay-inset px-3 py-1.5 text-slate-800 num-bn"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">শীর্ষ ঘোষণা বার (Announcement Notice):</label>
              <input
                type="text"
                value={settingsForm.announcementNotice}
                onChange={e => setSettingsForm({ ...settingsForm, announcementNotice: e.target.value })}
                className="w-full clay-inset px-3 py-1.5 text-slate-800"
              />
            </div>

            {settingsSaveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block font-bold">সেটিংস সংরক্ষণ ব্যর্থ:</strong>
                  <span>{settingsSaveError}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingSettings}
              className="clay-btn-primary px-6 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSavingSettings ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>সংরক্ষণ করা হচ্ছে...</span>
                </>
              ) : (
                <span>সেটিংস সংরক্ষণ করুন</span>
              )}
            </button>
          </form>

          {/* Gmail Order Notifications & SMTP Settings Card */}
          <div className="clay-card p-5 sm:p-6 bg-white space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-rose-600" />
                  <span>Gmail নতুন অর্ডার নোটিফিকেশন সেটিংস (SMTP)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  কাস্টমার সফলভাবে অর্ডার সাবমিট করলেই অ্যাডমিনের Gmail-এ স্বয়ংক্রিয়ভাবে অর্ডারের সম্পূর্ণ রসিদ চলে যাবে।
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                  emailStatus?.configured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {emailStatus?.configured ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>SMTP সক্রিয় (Active)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>কনফিগার প্রয়োজন</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Diagnostics Banner */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px] text-slate-600 border border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong>অ্যাডমিন নোটিফিকেশন প্রাপক:</strong>{' '}
                  <span className="font-mono text-rose-600 font-bold">
                    {settingsForm.adminNotificationEmail || 'mdmohammad.644633815@gmail.com'}
                  </span>
                </div>
                <div>
                  <strong>সার্ভার হোস্টিং:</strong> {emailStatus?.smtpHost || 'smtp.gmail.com'}:{emailStatus?.smtpPort || 465}
                </div>
              </div>
              {emailStatus?.smtpUserMasked && (
                <div>
                  <strong>প্রেরক অ্যাকাউন্ট:</strong> <span className="font-mono">{emailStatus.smtpUserMasked}</span>
                </div>
              )}
            </div>

            {/* SMTP Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  অ্যাডমিন নোটিফিকেশন ইমেইল (যেখানে ইমেইল যাবে):
                </label>
                <input
                  type="email"
                  value={settingsForm.adminNotificationEmail || 'mdmohammad.644633815@gmail.com'}
                  onChange={e => setSettingsForm({ ...settingsForm, adminNotificationEmail: e.target.value })}
                  placeholder="mdmohammad.644633815@gmail.com"
                  className="w-full clay-inset px-3 py-1.5 text-slate-800 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  প্রেরক Gmail আইডি (SMTP User):
                </label>
                <input
                  type="email"
                  value={settingsForm.smtpUser || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, smtpUser: e.target.value })}
                  placeholder="যেমন: yourstore@gmail.com"
                  className="w-full clay-inset px-3 py-1.5 text-slate-800 font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    Google App Password (১৬-ডিজিটের অ্যাপ পাসওয়ার্ড):
                  </label>
                  {settingsForm.hasSmtpPass && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      ✓ ডেটাবেসে সংরক্ষিত আছে
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={settingsForm.smtpPass || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, smtpPass: e.target.value })}
                    placeholder={settingsForm.hasSmtpPass ? '•••••••••••••••• (সংরক্ষিত আছে - পরিবর্তন করতে চাইলে লিখুন)' : 'xxxx xxxx xxxx xxxx'}
                    className="w-full clay-inset px-3 py-1.5 pr-8 text-slate-800 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSmtpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {settingsForm.hasSmtpPass && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    পাসওয়ার্ড পূর্বে সংরক্ষিত রয়েছে। নতুন পাসওয়ার্ড না দিতে চাইলে ঘরটি খালি রাখতে পারেন।
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SMTP Host:</label>
                  <input
                    type="text"
                    value={settingsForm.smtpHost || 'smtp.gmail.com'}
                    onChange={e => setSettingsForm({ ...settingsForm, smtpHost: e.target.value })}
                    className="w-full clay-inset px-3 py-1.5 text-slate-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SMTP Port:</label>
                  <input
                    type="number"
                    value={settingsForm.smtpPort || 465}
                    onChange={e => setSettingsForm({ ...settingsForm, smtpPort: Number(e.target.value) })}
                    className="w-full clay-inset px-3 py-1.5 text-slate-800 font-mono text-xs num-bn"
                  />
                </div>
              </div>
            </div>

            {/* Setup Instructions Accordion */}
            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-[11px] text-slate-700 space-y-1.5">
              <h5 className="font-bold text-rose-800 flex items-center gap-1.5">
                <span>🔑 ১৬-ডিজিটের Google অ্যাপ পাসওয়ার্ড (App Password) পাওয়ার নিয়ম:</span>
              </h5>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                <li>আপনার Google অ্যাকাউন্টে যান: <span className="font-mono text-rose-700 font-semibold">myaccount.google.com/security</span></li>
                <li>নিশ্চিত করুন আপনার অ্যাকাউন্টে <strong>2-Step Verification</strong> চালু আছে।</li>
                <li>Security পৃষ্ঠায় নিচে স্ক্রোল করে <strong>App Passwords</strong> নির্বাচন করুন।</li>
                <li>অ্যাপের নাম দিন (যেমন: <strong className="font-mono">ZX Shop</strong>) এবং <strong>Create</strong> বাটনে চাপ দিন।</li>
                <li>গুগল ১৬-অক্ষরের একটি পাসওয়ার্ড দিবে, সেটি কপি করে উপরের বক্সে দিন।</li>
              </ol>
            </div>

            {/* Error & Success Feedback Banners */}
            {smtpSaveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block font-bold">SMTP সংরক্ষণ ত্রুটি:</strong>
                  <span>{smtpSaveError}</span>
                </div>
              </div>
            )}

            {smtpSaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{smtpSaveSuccess}</span>
              </div>
            )}

            {/* Action Row */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingSmtp}
                onClick={() => handleSaveSmtpSettings()}
                className="clay-btn-primary px-5 py-2 text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingSmtp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>সংরক্ষণ করা হচ্ছে...</span>
                  </>
                ) : (
                  <span>SMTP সেটিংস সংরক্ষণ করুন</span>
                )}
              </button>

              <button
                type="button"
                disabled={isSendingTestEmail}
                onClick={handleSendTestEmail}
                className="clay-btn-secondary px-4 py-2 text-xs font-bold text-rose-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTestEmail ? 'টেস্ট ইমেইল পাঠানো হচ্ছে...' : 'টেস্ট ইমেইল পাঠান (Test Send)'}</span>
              </button>
            </div>
          </div>

          {/* Change Password Box */}
          <div className="clay-card p-5 sm:p-6 bg-white space-y-3.5 text-xs">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">
              অ্যাডমিন পাসওয়ার্ড পরিবর্তন
            </h3>

            <form onSubmit={handleChangePassword} className="max-w-sm space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর):</label>
                <input
                  type="password"
                  required
                  value={newAdminPass}
                  onChange={e => setNewAdminPass(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড দিন..."
                  className="w-full clay-inset px-3 py-1.5 text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="clay-btn-secondary px-4 py-2 text-xs font-bold text-rose-600 cursor-pointer"
              >
                পাসওয়ার্ড পরিবর্তন করুন
              </button>
            </form>
          </div>

          {/* Database Backup & Persistence Card */}
          <div className="clay-card p-5 sm:p-6 bg-white space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ডেটাবেস ব্যাকআপ ও ডেটা স্থায়িত্ব সুরক্ষা</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                অটোমেটিক স্ন্যাপশট সক্রিয়
              </span>
            </div>

            <p className="text-slate-600 text-[11px] leading-relaxed">
              পণ্য, ক্যাটাগরি, অর্ডার ও সেটিংসের প্রতিটি পরিবর্তনের পর স্বয়ংক্রিয়ভাবে পারসিস্টেন্ট স্টোরেজ এবং রোলিং স্ন্যাপশট ব্যাকআপ সংরক্ষিত হয়। সার্ভার রিস্টার্ট বা পেজ রিফ্রেশ করলেও সকল ডেটা নিরাপদ থাকবে।
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadJsonBackup}
                className="clay-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="আপনার সব প্রোডাক্ট ও সেটিংস এক ক্লিকে ডাউনলোড করে রাখুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span>সম্পূর্ণ ডেটাবেস ডাউনলোড (JSON Export)</span>
              </button>

              <label
                className="clay-btn-secondary px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
                title="পূর্বে ডাউনলোড করা ব্যাকআপ ফাইল থেকে রিস্টোর করুন"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>ব্যাকআপ ফাইল থেকে রিস্টোর (JSON Import)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreJsonBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                disabled={isCreatingBackup}
                onClick={handleCreateBackup}
                className="clay-btn-secondary px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCreatingBackup ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>ব্যাকআপ নেওয়া হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>সার্ভার স্ন্যাপশট ব্যাকআপ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
