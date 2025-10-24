'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductsByCategory } from '@/service/api/category';
import ProductCard from '@/components/customer/ProductCard';
import type { Product } from '@/types/type';

export default function ProductDisplayPage() {
  const params = useParams();
  const router = useRouter();
  
  const categoryNameParam = params.categoryName;
  const categoryNameEncoded =
    typeof categoryNameParam === 'string'
      ? categoryNameParam
      : Array.isArray(categoryNameParam)
      ? categoryNameParam[0]
      : '';
  
  // ✅ Decode URL สำหรับแสดงผลและส่งไป API
  const categoryName = decodeURIComponent(categoryNameEncoded);

  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  
  // Filter states - เหลือแค่ราคา
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
  });

  // Pagination - เปลี่ยนเป็น 6 ชิ้นต่อหน้า
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Helper function สำหรับแสดงราคา
  const getDisplayPrice = (product: Product) => {
    if (product.price == null) return 'ติดต่อร้านค้า';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(product.price);
  };

  const handleProductCardClick = (product: Product) => {
    // ✅ ไปหน้า product detail แทนการเปิด modal
    router.push(`/product/${product.product_id}`);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
    });
  };

  // Apply filters & sort
  const getFilteredAndSortedProducts = () => {
    const filtered = [...products];

    // Apply filters here if needed
    // (เพิ่มโลจิกกรองตาม filters ได้ตามต้องการ)

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => (b.product_id || 0) - (a.product_id || 0));
        break;
      case 'price_low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (!categoryName) return;
    
    const loadData = async () => {
      try {
        //console.log('📤 Loading products for category:', categoryName);
        const productsByCat = await getProductsByCategory(categoryName);
        //console.log('✅ Products received:', productsByCat);
        setProducts(productsByCat);
      } catch (error) {
        console.error('🚫 Load products by category failed:', error);
      }
    };
    loadData();
  }, [categoryName]);

  return (
    <div className="min-h-screen bg-bgpage">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* ปุ่มย้อนกลับ */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-blue-600 mb-4 font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          ย้อนกลับ
        </button>

        {/* Breadcrumb */}
        <nav className="text-sm text-textmuted">
          หน้าหลัก / {categoryName || 'หมวดหมู่'}
        </nav>
        <h1 className="text-2xl font-semibold mt-2 mb-4">
          {categoryName || 'สินค้าทั้งหมด'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* ----- Filters Sidebar ----- */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-card shadow-card p-4 sticky top-4">
              <h2 className="font-semibold mb-4">ตัวกรอง</h2>

              {/* Price */}
              <div className="mb-5">
                <div className="font-medium mb-2">ช่วงราคา</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full bg-bgpage rounded-input px-3 py-2 outline-none text-sm"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full bg-bgpage rounded-input px-3 py-2 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleClearFilters}
                  className="flex-1 rounded-pill border py-2 text-sm hover:bg-gray-50"
                >
                  ล้าง
                </button>
                <button className="flex-1 rounded-pill bg-primary text-white py-2 text-sm hover:bg-blue-600">
                  ใช้งาน
                </button>
              </div>
            </div>
          </aside>

          {/* ----- Results Section ----- */}
          <section className="md:col-span-3">
            {/* Toolbar */}
            <div className="bg-white rounded-card shadow-card p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-textmuted">
                แสดง {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} จาก{' '}
                {filteredProducts.length} รายการ
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-textmuted">เรียงโดย</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-bgpage rounded-input px-3 py-2 outline-none"
                >
                  <option value="relevance">ความเกี่ยวข้อง</option>
                  <option value="newest">ใหม่ล่าสุด</option>
                  <option value="price_low">ราคา: ต่ำ - สูง</option>
                  <option value="price_high">ราคา: สูง - ต่ำ</option>
                  <option value="best_selling">ขายดี</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="mt-4">
              {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedProducts.map((product) => (
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
                  ยังไม่มีสินค้าในหมวดหมู่นี้
                </p>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center text-sm">
                <div className="text-textmuted">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-pill border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Prev
                  </button>
                  
                  {[...Array(Math.min(3, totalPages))].map((_, i) => {
                    const pageNum = currentPage <= 2 ? i + 1 : currentPage - 1 + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-pill ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'border hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-pill border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}