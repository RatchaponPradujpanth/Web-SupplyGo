'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadUsername, fetchUserRole } from '@/service/apis';
import { loadPublicProducts, loadShopProducts } from '@/service/api/loadproduct';
import { addtocart } from '@/service/api/addtocart';
import { getCategories } from '@/service/api/category';
import type { Product, Category } from '@/types/type';
import ProductCard from '@/components/customer/ProductCard';
import ProductDetail from '@/components/customer/ProductDetail';

export default function UserDashboardPage() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const router = useRouter();

  // Mapping icon สำหรับ category (frontend)
  const categoryIcons: Record<string, string> = {
    Electronics: '🔌',
    Fashion: '👕',
    'Home & Kitchen': '🍳',
    Beauty: '🧴',
    Sports: '🏋️',
    Furniture: '🛋️',
    Baby: '🍼',
    Tools: '🧰',
  };

  // ฟังก์ชัน format ราคา
  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return 'ติดต่อร้านค้า';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getDisplayPrice = (product: Product, variantId?: number | null) => {
    if (product.product_variants && product.product_variants.length > 0) {
      if (variantId) {
        const selectedVariant = product.product_variants.find(v => v.variant_id === variantId);
        return formatPrice(selectedVariant?.price);
      } else {
        const prices = product.product_variants
          .map(v => v.price)
          .filter((p): p is number => p !== null);
        if (prices.length === 0) return 'ติดต่อร้านค้า';
        if (prices.length === 1) return formatPrice(prices[0]);
        return `${formatPrice(Math.min(...prices))} - ${formatPrice(Math.max(...prices))}`;
      }
    } else {
      return formatPrice(product.price);
    }
  };

  // โหลดข้อมูล user + products + categories
  useEffect(() => {
    const loadData = async () => {
      let token = localStorage.getItem('token');
      let userRole = null;

      // ตรวจสอบ token และ role
      if (token) {
        try {
          userRole = await fetchUserRole(token);
          setRole(userRole);
        } catch (err) {
          console.warn("⚠️ Token invalid or expired, loading public products...");
          localStorage.removeItem('token');
          token = null; // reset token
          setRole(null);
        }
      }

      // ถ้าเป็น store redirect ออกไป
      if (userRole === 'store') {
        router.push('/store/dashboard');
        return;
      }

      // โหลด products และ categories (ไม่ว่าจะมี token หรือไม่)
      try {
        if (token && userRole !== null) {
          const name = await loadUsername(token);
          setUsername(name);
          const userProducts = await loadShopProducts(token);
          setProducts(userProducts);
        } else {
          const publicProducts = await loadPublicProducts();
          setProducts(publicProducts);
        }

        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('🚫 Error loading dashboard:', err);
      }
    };

    loadData();
  }, [router]);


  // ฟังก์ชัน login check
  const requireLogin = (action: () => void) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ กรุณาเข้าสู่ระบบก่อนทำรายการ');
      router.push('/login');
      return;
    }
    action();
  };

  // เพิ่มสินค้าในตะกร้า
  const handleAddToCart = async (productId: number, quantity: number, variantId?: number, optionValueIds?: number[]) => {
    requireLogin(async () => {
      try {
        await addtocart(productId, quantity, variantId, optionValueIds);
        alert('✅ เพิ่มสินค้าลงตะกร้าแล้ว');
      } catch (error) {
        console.error("❌ ไม่สามารถเพิ่มสินค้าลงตะกร้าได้:", error);
        alert('เกิดข้อผิดพลาดขณะเพิ่มสินค้า');
      }
    });
  };

  const handleProductCardClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleCategoryClick = async (categoryName: string) => {
    // ไปหน้า /category/[slug] หรือดึง products ตาม category
    router.push(`/category/${categoryName.toLowerCase().replace(/\s+/g, '-')}`);
  };

  if (selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        getDisplayPrice={getDisplayPrice}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-bgpage text-textmain p-6">
      
      {/* ----- Section: Top Categories ----- */}
      <section className="w-full max-w-7xl bg-white rounded-card shadow-card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Shop from Top Categories</h2>
        <div className="grid grid-cols-3 md:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.category_name}
              onClick={() => handleCategoryClick(cat.category_name)}
              className="bg-white rounded-card shadow-card p-4 flex flex-col items-center hover:shadow-md transition"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {categoryIcons[cat.category_name] || '📦'}
              </div>
              <span className="mt-2 text-sm font-medium text-center">{cat.category_name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ----- Section: Products ----- */}
      <section className="w-full max-w-7xl bg-white rounded-card shadow-card p-6 mb-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">สินค้า</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onSelect={handleProductCardClick}
                getDisplayPrice={getDisplayPrice}
              />
            ))}
          </div>
        ) : (
          <p className="italic text-textmuted text-center">ยังไม่มีสินค้าในร้าน</p>
        )}
      </section>

      {/* ----- Buttons ----- */}
      <div className="flex flex-wrap gap-4 justify-center w-full max-w-7xl mb-8">
        <button
          onClick={() => requireLogin(() => router.push('/cart'))}
          className="rounded-pill px-6 py-2 bg-secondary text-textmain font-medium hover:bg-secondary/80 transition"
        >
          🛒 ไปดูตะกร้าสินค้า
        </button>

        <button
          onClick={() => requireLogin(() => router.push('/orderhistory'))}
          className="rounded-pill px-6 py-2 bg-primary text-white font-medium hover:bg-primary/80 transition"
        >
          📦 ดูประวัติคำสั่งซื้อ
        </button>

        <button
          onClick={() => router.push('/topup')}
          className="rounded-pill px-6 py-2 bg-accent text-white font-medium hover:bg-accent/80 transition"
        >
          🤝 ไปหน้า Group Buying
        </button>

        <button
          onClick={handleLogout}
          className="rounded-pill px-6 py-2 border border-gray-200 text-textmuted hover:border-primary/40 hover:text-primary transition"
        >
          Logout / Clear Token
        </button>
      </div>
    </div>
  );
}
