'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import Footer from '@/components/layout/Footer';

interface Product {
  product_id: number;
  product_name: string;
  product_description: string;
  price: number;
  image: string | null;
  category_name?: string;
  product_images?: {
    id: number;
    image_url: string;
    is_primary: boolean;
  }[];
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'relevant' | 'price-asc' | 'price-desc'>('relevant');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/loaduserproduct`);
      const allProducts = response.data;

      // กรองสินค้าที่ชื่อหรือคำอธิบายมีคำค้นหา
      const filtered = allProducts.filter((product: Product) => {
        const nameMatch = product.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const descMatch = product.product_description?.toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || descMatch;
      });

      setProducts(filtered);
    } catch (error) {
      console.error('Error searching products:', error);
      alert('ไม่สามารถค้นหาสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      searchProducts(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // เรียงลำดับสินค้า
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-asc') {
      return (a.price || 0) - (b.price || 0);
    } else if (sortBy === 'price-desc') {
      return (b.price || 0) - (a.price || 0);
    }
    return 0; // relevant - เรียงตามลำดับเดิม
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // ไม่ต้องทำอะไร เพราะใช้ search bar ที่ header
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return 'ติดต่อร้านค้า';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const getImageUrl = (product: Product) => {
    const imageUrl = product.image || product.product_images?.[0]?.image_url;
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  return (
    <div className="min-h-screen bg-bgpage">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Results Header & Sort */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-textmain">
              ผลการค้นหา {query && (
                <>
                  สำหรับ &ldquo;<span className="text-primary">{query}</span>&rdquo;
                </>
              )}
            </h1>
            <p className="text-textmuted mt-2">
              {loading ? 'กำลังค้นหา...' : `พบ ${products.length} รายการ`}
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-textmuted">เรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevant' | 'price-asc' | 'price-desc')}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-primary transition"
            >
              <option value="relevant">เกี่ยวข้อง</option>
              <option value="price-asc">ราคา: ต่ำ → สูง</option>
              <option value="price-desc">ราคา: สูง → ต่ำ</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && sortedProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {sortedProducts.map((product) => {
              const imageUrl = getImageUrl(product);
              
              return (
                <button
                  key={product.product_id}
                  onClick={() => router.push(`/product/${product.product_id}`)}
                  className="bg-white rounded-card shadow-card overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="aspect-square relative bg-gray-50">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.product_name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-textmain line-clamp-2 mb-2">
                      {product.product_name}
                    </h3>
                    {product.category_name && (
                      <p className="text-xs text-textmuted mb-2">
                        {product.category_name}
                      </p>
                    )}
                    <p className="text-primary font-bold">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && query && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-textmain mb-2">
              ไม่พบสินค้าที่ค้นหา
            </h3>
            <p className="text-textmuted mb-6">
              ไม่พบสินค้าที่มีคำว่า &ldquo;{query}&rdquo; ลองค้นหาด้วยคำอื่นดูนะ
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-primary text-white rounded-pill hover:bg-primary/90 transition"
            >
              กลับหน้าแรก
            </button>
          </div>
        )}

        {/* No Query State */}
        {!loading && !query && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-textmain mb-2">
              พิมพ์คำค้นหาเพื่อเริ่มต้น
            </h3>
            <p className="text-textmuted">
              ค้นหาสินค้าที่คุณต้องการด้านบน
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
