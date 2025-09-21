'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadUsername, fetchUserRole } from '@/service/apis';
import { loaduserproduct } from '@/service/api/loaduserproduct';
import { addtocart } from '@/service/api/addtocart';
import type { Product } from '@/types/type';
import ProductCard from '@/components/customer/ProductCard';
import ProductDetail from '@/components/customer/ProductDetail';

export default function UserDashboardPage() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const router = useRouter();

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return 'ติดต่อร้านค้า';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // ฟังก์ชัน helper แสดงราคาช่วง
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

  // load data
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const userRole = await fetchUserRole(token);
        setRole(userRole);

        if (userRole === 'store') {
          router.push('/dashboard');
          return;
        }

        const name = await loadUsername(token);
        setUsername(name);

        const userProducts = await loaduserproduct();
        setProducts(userProducts);
      } catch (err) {
        console.error('🚫 Error loading user dashboard:', err);
        router.push('/');
      }
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleAddToCart = async (productId: number, quantity: number, variantId?: number, optionValueIds?: number[]) => {
    console.log("🚀 เพิ่มสินค้าลงตะกร้า:", { productId, quantity, variantId, optionValueIds });

    try {
      await addtocart(productId, quantity, variantId, optionValueIds);
      alert('✅ เพิ่มสินค้าลงตะกร้าแล้ว');
    } catch (error) {
      console.error("❌ ไม่สามารถเพิ่มสินค้าลงตะกร้าได้:", error);
      alert('เกิดข้อผิดพลาดขณะเพิ่มสินค้า');
    }
  };

  const handleProductCardClick = (product: Product) => {
    setSelectedProduct(product);
  };

  // ถ้าเลือกสินค้าแล้ว ให้แสดง ProductDetail
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

  // ----- Dashboard / Product List Page -----
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-bgpage text-textmain p-6">
  <div className="w-full max-w-7xl bg-white rounded-card shadow-card p-6">
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
  </div>

  <div className="flex flex-wrap gap-4 justify-center mt-6 w-full max-w-7xl">
    <button
      onClick={() => router.push('/cart')}
      className="rounded-pill px-6 py-2 bg-secondary text-textmain font-medium hover:bg-secondary/80 transition"
    >
      🛒 ไปดูตะกร้าสินค้า
    </button>

    <button
      onClick={() => router.push('/orderhistory')}
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