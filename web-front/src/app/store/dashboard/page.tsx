'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadUsername,
  loadstorename,
  regisstripe,
  fetchUserRole,
} from '@/service/apis';
import { primarypicture } from '@/service/api/setprimarypicture';
import type { Product } from '@/types/type';
import AddProductForm from '@/components/AddProductForm';
import ShopOrderHistory from '@/components/shop/ShopOrderHistory';
import GroupOrderList from '@/components/shop/GroupOrderList';
import ShopProductsList from '@/components/shop/ShopProductsList';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StoreDashboardPage() {
  const [username, setUsername] = useState('');
  const [storeName, setStoreName] = useState('');
  const [shopId, setShopId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [primaryImages, setPrimaryImages] = useState<Record<number, string | null>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'add-product' | 'orders'|'orders-group'|'product'>('dashboard');

  const router = useRouter();

  const getStockStatusColor = (stock: number) => {
    if (stock <= 0) return 'bg-red-600';
    if (stock <= 5) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  // ===== Load store info & products =====
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const role = await fetchUserRole(token);
      if (role !== 'store') {
        router.push('/user-dashboard');
        return;
      }

      const name = await loadUsername(token);
      setUsername(name);

      const store = await loadstorename(token);
      setStoreName(store.shop_name);
      setShopId(store.shop_id);
      setStripeConnected(Boolean(store.stripe_account_id));

      
    };

    loadData();
  }, [router]);

  

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleSetPrimary = async (productId: number, imageId: number) => {
    try {
      await primarypicture(productId, imageId);
      alert('ตั้งรูปหลักสำเร็จ');

      const product = products.find((p) => p.product_id === productId);
      if (!product) return;

      const newPrimaryImageUrl =
        product.product_images?.find((img) => img.id === imageId)?.image_url || null;
      if (newPrimaryImageUrl) {
        setPrimaryImages((prev) => ({ ...prev, [productId]: newPrimaryImageUrl }));
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการตั้งรูปหลัก');
      console.error(error);
    }
  };

  const handleAddProductSuccess = async () => {
    setCurrentView('dashboard');
  };

  // ===== Render =====
  return (
    <div className="min-h-screen bg-bgpage text-textmain px-6 py-8 grid md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <aside className="md:col-span-1 bg-white rounded-card shadow-card p-4 sticky top-4 h-fit">
        <nav className="space-y-2 text-sm">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
              currentView === 'dashboard' ? 'bg-primary text-white' : 'hover:bg-primary/10 hover:text-primary'
            }`}
          >
            Dashboard
          </button>
<button
            onClick={() => setCurrentView('product')}
            className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
              currentView === 'product' ? 'bg-primary text-white' : 'hover:bg-primary/10 hover:text-primary'
            }`}
          >
            คลังสินค้า
          </button>

          <button
            onClick={() => setCurrentView('orders')}
            className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
              currentView === 'orders' ? 'bg-primary text-white' : 'hover:bg-primary/10 hover:text-primary'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setCurrentView('add-product')}
            className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
              currentView === 'add-product' ? 'bg-primary text-white' : 'hover:bg-primary/10 hover:text-primary'
            }`}
          >
            เพิ่มสินค้า
          </button>

            <button
            onClick={() => setCurrentView('orders-group')}
            className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
              currentView === 'orders-group' ? 'bg-primary text-white' : 'hover:bg-primary/10 hover:text-primary'
            }`}
          >
            ออเดอร์ group
          </button>



          <button
            onClick={handleLogout}
            className="w-full text-left block px-3 py-2 rounded-pill hover:bg-red-600 hover:text-white transition"
          >
            🚪 Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <section className="md:col-span-3 space-y-6">
        {currentView === 'dashboard' && (
          <>
            <div className="bg-white rounded-card shadow-card p-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold mb-1">📦 Store Dashboard</h1>
                <p className="text-textmuted">
                  👋 ยินดีต้อนรับคุณ <span className="font-semibold">{username}</span>
                </p>
                <p className="text-textmuted">
                  🏪 ร้าน: <span className="font-semibold">{storeName}</span> | 🆔 Shop ID: {shopId}
                </p>
              </div>
              <div>
                {stripeConnected ? (
                  <p className="text-green-600 font-semibold">✅ เชื่อมต่อ Stripe แล้ว</p>
                ) : (
                  <button
                    onClick={() => regisstripe(localStorage.getItem('token')!)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition"
                  >
                    ➕ เชื่อมบัญชี Stripe
                  </button>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-card shadow-card p-4 text-center">
                <p className="text-sm text-textmuted">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <div className="bg-white rounded-card shadow-card p-4 text-center">
                <p className="text-sm text-textmuted">Low Stock Items</p>
                <p className="text-2xl font-bold">{products.filter((p) => (p.total_stock ?? 0) <= 5).length}</p>
              </div>
              <div className="bg-white rounded-card shadow-card p-4 text-center">
                <p className="text-sm text-textmuted">Hot Deal Items</p>
                <p className="text-2xl font-bold">{products.filter((p) => p.status === 'hot').length}</p>
              </div>
            </div>

            
          </>
        )}

        {currentView === 'add-product' && (
          <AddProductForm onSuccess={handleAddProductSuccess} onCancel={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'orders' && (
          <ShopOrderHistory />
        )}

        {currentView === 'orders-group' && (
          <GroupOrderList/>
        )}

{        currentView === 'product' && (
          <ShopProductsList />
        )}



      </section>
    </div>
  );
}