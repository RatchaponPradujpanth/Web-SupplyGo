'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getProductsByCategory } from '@/service/api/category';
import { addtocart } from '@/service/api/addtocart';
import ProductCard from '@/components/customer/ProductCard';
import ProductDetail from '@/components/customer/ProductDetail';
import type { Product } from '@/types/type';

export default function ProductDisplayPage() {
  const params = useParams();
  
  // ✅ รับค่า categoryName แบบปลอดภัย (string)
  const categoryNameParam = params.categoryName;
  const categoryName =
    typeof categoryNameParam === 'string'
      ? categoryNameParam
      : Array.isArray(categoryNameParam)
      ? categoryNameParam[0]
      : '';

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ฟังก์ชัน format ราคา
  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return 'ติดต่อร้านค้า';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // ฟังก์ชันแสดงราคา (รองรับ variants)
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

  // ฟังก์ชัน login check
  const requireLogin = (action: () => void) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ กรุณาเข้าสู่ระบบก่อนทำรายการ');
      // router.push('/login');
      return;
    }
    action();
  };

  // เพิ่มสินค้าในตะกร้า
  const handleAddToCart = async (
    productId: number,
    quantity: number,
    variantId?: number,
    optionValueIds?: number[]
  ) => {
    requireLogin(async () => {
      try {
        await addtocart(productId, quantity, variantId, optionValueIds);
        alert('✅ เพิ่มสินค้าลงตะกร้าแล้ว');
        setSelectedProduct(null); // ปิด modal หลังเพิ่มสำเร็จ
      } catch (error) {
        console.error('❌ ไม่สามารถเพิ่มสินค้าลงตะกร้าได้:', error);
        alert('เกิดข้อผิดพลาดขณะเพิ่มสินค้า');
      }
    });
  };

  // จัดการคลิกที่การ์ดสินค้า
  const handleProductCardClick = (product: Product) => {
    setSelectedProduct(product);
  };

  // โหลดข้อมูลสินค้า
  useEffect(() => {
    if (!categoryName) return;
    
    const loadData = async () => {
      try {
        console.log('📤 Loading products for category:', categoryName);
        const productsByCat = await getProductsByCategory(categoryName);
        console.log('✅ Products received:', productsByCat);
        setProducts(productsByCat);
      } catch (error) {
        console.error('🚫 Load products by category failed:', error);
      }
    };
    loadData();
  }, [categoryName]);

  // ถ้าเปิด Modal แสดงรายละเอียดสินค้า
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
    <div className="min-h-screen bg-bgpage p-6">
      <div className="max-w-7xl mx-auto">
        {/* ----- Section: Products ----- */}
        <section className="bg-white rounded-card shadow-card p-6">
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
            <p className="italic text-textmuted text-center py-8">
              ยังไม่มีสินค้าในร้าน
            </p>
          )}
        </section>
      </div>
    </div>
  );
}