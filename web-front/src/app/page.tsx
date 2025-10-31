'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadUsername } from '@/service/api/loadusername';
import { loadPublicProducts, loadShopProducts } from '@/service/api/loadproduct';
import { addtocart } from '@/service/api/addtocart';
import { getCategories } from '@/service/api/category';
import type { Product, Category } from '@/types/type';
import ProductCard from '@/components/customer/ProductCard';
import ProductDetail from '@/components/customer/ProductDetail';
import Footer from '@/components/layout/Footer';
import { fetchUserRole } from '@/service/api/fetchrole';
import { 
  Flame, 
  Users, 
  ShoppingCart, 
  Package, 
  User, 
  Gift, 
  ShoppingBag,
  Zap,
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  Armchair,
  Baby,
  Wrench,
  Box,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function UserDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);

  const router = useRouter();
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);

  // Mapping icon + mapping label ภาษาไทย
const categoryIconsMap: Record<string, React.ReactNode> = {
  Electronics: <Smartphone className="w-6 h-6" />,
  Fashion: <Shirt className="w-6 h-6" />,
  'Home & Kitchen': <Home className="w-6 h-6" />,
  Beauty: <Sparkles className="w-6 h-6" />,
  Sports: <Dumbbell className="w-6 h-6" />,
  Furniture: <Armchair className="w-6 h-6" />,
  Baby: <Baby className="w-6 h-6" />,
  Tools: <Wrench className="w-6 h-6" />,
};

// Mapping สำหรับชื่อภาษาไทย
const categoryLabelsMap: Record<string, string> = {
  Electronics: 'อิเล็กทรอนิกส์',
  Fashion: 'แฟชั่น',
  'Home & Kitchen': 'บ้านและครัว',
  Beauty: 'ความงาม',
  Sports: 'กีฬา',
  Furniture: 'เฟอร์นิเจอร์',
  Baby: 'เด็ก',
  Tools: 'เครื่องมือ',
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
      setLoading(true);
      let token = localStorage.getItem('token');
      let userRole = null;

      // ตรวจสอบ token และ role
      if (token) {
        try {
          userRole = await fetchUserRole(token);
        } catch {
          console.warn("⚠️ Token invalid or expired, loading public products...");
          localStorage.removeItem('token');
          token = null; // reset token
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
          await loadUsername(token);
          const userProducts = await loadPublicProducts();
          setProducts(userProducts);
        } else {
          const publicProducts = await loadPublicProducts();
          setProducts(publicProducts);
        }

        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('🚫 Error loading dashboard:', err);
      } finally {
        setLoading(false);
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

  // Shuffle products แบบสุ่ม และเอาแค่ 12 ชิ้น (3 แถว)
  const shuffledProducts = [...products].sort(() => Math.random() - 0.5).slice(0, 12);

  return (
    <div className="min-h-screen bg-bgpage">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-primary to-primary/80 rounded-card shadow-card p-8 md:p-12 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="w-8 h-8 text-orange-300" />
                <h1 className="text-3xl md:text-4xl font-bold">สินค้าลดราคาวันนี้</h1>
              </div>
              <p className="text-lg md:text-xl opacity-90 mb-6">
                ร่วมกลุ่มซื้อสินค้าเพื่อรับส่วนลดพิเศษ!
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/groupbuying')}
                  className="rounded-pill px-6 py-3 bg-secondary text-textmain font-semibold hover:bg-secondary/90 transition shadow-md flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  <span>เริ่มการซื้อแบบกลุ่ม</span>
                </button>
                <button
                  onClick={() => requireLogin(() => router.push('/cart'))}
                  className="rounded-pill px-6 py-3 bg-white text-primary font-semibold hover:bg-gray-50 transition shadow-md flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>ดูตะกร้าสินค้า</span>
                </button>
              </div>
            </div>
            <div className="hidden md:block opacity-20">
              <Gift className="w-32 h-32" />
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
          <button
            onClick={() => requireLogin(() => router.push('/order'))}
            className="bg-white rounded-card shadow-card p-5 hover:shadow-md transition group"
          >
            <div className="flex justify-center mb-2">
              <Package className="w-10 h-10 text-primary group-hover:scale-110 transition" />
            </div>
            <h3 className="font-semibold text-sm md:text-base">ประวัติการสั่งซื้อ</h3>
            <p className="text-xs text-textmuted mt-1">ติดตามคำสั่งซื้อ</p>
          </button>

          <button
            onClick={() => requireLogin(() => router.push('/profile'))}
            className="bg-white rounded-card shadow-card p-5 hover:shadow-md transition group"
          >
            <div className="flex justify-center mb-2">
              <User className="w-10 h-10 text-primary group-hover:scale-110 transition" />
            </div>
            <h3 className="font-semibold text-sm md:text-base">โปรไฟล์</h3>
            <p className="text-xs text-textmuted mt-1">จัดการบัญชี</p>
          </button>

          <button
            onClick={() => router.push('/groupbuying')}
            className="bg-white rounded-card shadow-card p-5 hover:shadow-md transition group col-span-2 md:col-span-1"
          >
            <div className="flex justify-center mb-2">
              <Users className="w-10 h-10 text-primary group-hover:scale-110 transition" />
            </div>
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
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition text-primary">
                      {categoryIconsMap[cat.category_name] || <Box className="w-6 h-6" />}
                    </div>
                    <span className="mt-2 text-xs md:text-sm font-medium text-center line-clamp-2">
  {categoryLabelsMap[cat.category_name] || cat.category_name}
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
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6 text-primary" />
                      <h2 className="text-2xl font-bold">สินค้าทั้งหมด</h2>
                    </div>
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
                <div className="flex justify-center mb-4">
                  <ShoppingBag className="w-24 h-24 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">ไม่พบสินค้า</h3>
                <p className="text-textmuted mb-6">กรุณากลับมาใหม่เร็วๆ นี้ เพื่อดูสินค้าราคาพิเศษ!</p>
                <button
                  onClick={() => router.push('/groupbuying')}
                  className="rounded-pill px-6 py-3 bg-primary text-white font-medium hover:bg-primary/90 transition inline-flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  <span>ดูการซื้อแบบกลุ่ม</span>
                </button>
              </div>
            )}

            {/* Special Banner */}
            <section className="mt-12 bg-gradient-to-r from-accent to-accent/80 rounded-card shadow-card p-8 text-white text-center">
              <div className="flex justify-center mb-3">
                <DollarSign className="w-12 h-12" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">ประหยัดมากขึ้นด้วยการซื้อแบบกลุ่ม!</h2>
              <p className="text-lg mb-6 opacity-90">
                รวมกลุ่มกับเพื่อนๆ และรับส่วนลดพิเศษ
              </p>
              <button
                onClick={() => router.push('/groupbuying')}
                className="rounded-pill px-8 py-3 bg-white text-accent font-semibold hover:bg-gray-50 transition shadow-md inline-flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                <span>เรียนรู้เพิ่มเติม</span>
              </button>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}