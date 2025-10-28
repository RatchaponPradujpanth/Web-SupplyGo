'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/type';
import ProductCard from '@/components/customer/ProductCard';
import ProductDetail from '@/components/customer/ProductDetail';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { addtocart } from '@/service/api/addtocart';
import { getDisplayPrice } from '@/utils/price';
import { getCategoryIcon } from '@/utils/ui';

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const router = useRouter();
  const { requireAuth } = useAuth();
  const { products, categories, loading, getShuffledProducts } = useProducts();

  // เพิ่มสินค้าในตะกร้า
  const handleAddToCart = async (productId: number, quantity: number, variantId?: number, optionValueIds?: number[]) => {
    requireAuth(async () => {
      try {
        await addtocart(productId, quantity, variantId, optionValueIds);
        alert('✅ เพิ่มสินค้าลงตะกร้าแล้ว');
      } catch (error) {
        console.error("❌ ไม่สามารถเพิ่มสินค้าลงตะกร้าได้:", error);
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดขณะเพิ่มสินค้า';
        alert(errorMessage);
        
        // ถ้า error เกี่ยวกับ token ให้ redirect ไป login
        if (errorMessage.includes('Session') || errorMessage.includes('เข้าสู่ระบบ')) {
          router.push('/login');
        }
      }
    });
  };

  const handleProductCardClick = (product: Product) => {
    router.push(`/product/${product.product_id}`);
  };

  const handleCategoryClick = (categoryName: string) => {
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/category/${slug}`);
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

  // Get shuffled products (12 items for 3 rows)
  const shuffledProducts = getShuffledProducts(12);

  return (
    <div className="min-h-screen bg-bgpage">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-primary to-primary/80 rounded-card shadow-card p-8 md:p-12 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">สินค้าลดราคาวันนี้ 🔥</h1>
              <p className="text-lg md:text-xl opacity-90 mb-6">
                ร่วมกลุ่มซื้อสินค้าเพื่อรับส่วนลดพิเศษ!
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/groupbuying')}
                  className="rounded-pill px-6 py-3 bg-secondary text-textmain font-semibold hover:bg-secondary/90 transition shadow-md"
                >
                  🤝 เริ่มการซื้อแบบกลุ่ม
                </button>
                <button
                  onClick={() => requireAuth(() => router.push('/cart'))}
                  className="rounded-pill px-6 py-3 bg-white text-primary font-semibold hover:bg-gray-50 transition shadow-md"
                >
                  🛒 ดูตะกร้าสินค้า
                </button>
              </div>
            </div>
            <div className="hidden md:block text-8xl opacity-20">
              🎁
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
          <button
            onClick={() => requireAuth(() => router.push('/order'))}
            className="bg-white rounded-card shadow-card p-5 hover:shadow-md transition group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition">📦</div>
            <h3 className="font-semibold text-sm md:text-base">ประวัติการสั่งซื้อ</h3>
            <p className="text-xs text-textmuted mt-1">ติดตามคำสั่งซื้อ</p>
          </button>

          <button
            onClick={() => requireAuth(() => router.push('/profile'))}
            className="bg-white rounded-card shadow-card p-5 hover:shadow-md transition group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition">👤</div>
            <h3 className="font-semibold text-sm md:text-base">โปรไฟล์</h3>
            <p className="text-xs text-textmuted mt-1">จัดการบัญชี</p>
          </button>

          <button
            onClick={() => router.push('/groupbuying')}
            className="bg-white rounded-card shadow-card p-5 hover:shadow-md transition group col-span-2 md:col-span-1"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition">🤝</div>
            <h3 className="font-semibold text-sm md:text-base">ซื้อแบบกลุ่ม</h3>
            <p className="text-xs text-textmuted mt-1">ประหยัดด้วยกัน</p>
          </button>
        </section>

        {/* Categories Section */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <section className="mb-10">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold">หมวดหมู่สินค้า</h2>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 max-w-4xl mx-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.category_name}
                    onClick={() => handleCategoryClick(cat.category_name)}
                    className="bg-white rounded-card shadow-card p-4 flex flex-col items-center hover:shadow-md hover:scale-105 transition group"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl group-hover:bg-primary/20 transition">
                      {getCategoryIcon(cat.category_name)}
                    </div>
                    <span className="mt-2 text-xs md:text-sm font-medium text-center line-clamp-2">
                      {cat.category_name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Best Sellers Section */}
            {shuffledProducts.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">สินค้าทั้งหมด 🛍️</h2>
                    <p className="text-textmuted text-sm mt-1">เลือกสรรสินค้าคุณภาพ</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {shuffledProducts.map((product) => (
                    <ProductCard
                      key={product.product_id}
                      product={product}
                      onSelect={handleProductCardClick}
                      getDisplayPrice={getDisplayPrice}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {products.length === 0 && (
              <div className="bg-white rounded-card shadow-card p-12 text-center">
                <div className="text-6xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold mb-2">ไม่พบสินค้า</h3>
                <p className="text-textmuted mb-6">กรุณากลับมาใหม่เร็วๆ นี้ เพื่อดูสินค้าราคาพิเศษ!</p>
                <button
                  onClick={() => router.push('/groupbuying')}
                  className="rounded-pill px-6 py-3 bg-primary text-white font-medium hover:bg-primary/90 transition"
                >
                  ดูการซื้อแบบกลุ่ม
                </button>
              </div>
            )}

            {/* Special Banner */}
            <section className="mt-12 bg-gradient-to-r from-accent to-accent/80 rounded-card shadow-card p-8 text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">💰 ประหยัดมากขึ้นด้วยการซื้อแบบกลุ่ม!</h2>
              <p className="text-lg mb-6 opacity-90">
                รวมกลุ่มกับเพื่อนๆ และรับส่วนลดพิเศษ
              </p>
              <button
                onClick={() => router.push('/groupbuying')}
                className="rounded-pill px-8 py-3 bg-white text-accent font-semibold hover:bg-gray-50 transition shadow-md"
              >
                เรียนรู้เพิ่มเติม
              </button>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
