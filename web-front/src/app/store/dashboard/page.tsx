'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadUsername,
  loadstorename,
  regisstripe,
  fetchUserRole,
} from '@/service/apis';
import { loadShopProducts } from '@/service/api/loadproduct';
import { primarypicture } from '@/service/api/setprimarypicture';
import type { Product } from '@/types/type';
import { loadShopProducts } from '@/service/api/loadproduct';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StoreDashboardPage() {
  const [username, setUsername] = useState('');
  const [storeName, setStoreName] = useState('');
  const [shopId, setShopId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [primaryImages, setPrimaryImages] = useState<Record<number, string | null>>({});
  const router = useRouter();

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

      const productList = await loadShopProducts(token);

      const fixedProductList: Product[] = productList.map((p: any) => ({
        product_id: p.product_id,
        product_name: p.product_name ?? '',
        product_description: p.product_description ?? '',
        price: p.price != null ? Number(p.price) : null,
        status: p.status ?? '',
        image: p.image ?? null,
        total_stock: p.total_stock ?? 0,
        product_variants: (p.product_variants ?? []).map((v: any) => ({
          variant_id: v.variant_id,
          sku: v.sku ?? '',
          price: v.price != null ? Number(v.price) : null,
          total_stock: v.total_stock ?? 0,
          image: v.image ?? null,
          variant_options: (v.variant_options ?? []).map((vo: any) => ({
            option_name: vo.option_name ?? '',
            value: vo.value ?? '',
          })),
        })),
        product_images: (p.product_images ?? []).map((img: any) => ({
          id: img.id,
          image_url: img.image_url.startsWith('http')
            ? img.image_url
            : `${API_URL}${img.image_url.startsWith('/') ? '' : '/'}${img.image_url}`,
          is_primary: img.is_primary ?? false,
          sort_order: img.sort_order ?? null,
        })),
      }));

      setProducts(fixedProductList);

      // เซ็ต primaryImages
      const mapPrimary: Record<number, string | null> = {};
      fixedProductList.forEach((p) => {
        const primaryImg =
          p.product_images?.find((img) => img.is_primary)?.image_url || p.image || null;
        mapPrimary[p.product_id] = primaryImg;
      });
      setPrimaryImages(mapPrimary);
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

      const newPrimaryImageUrl = product.product_images?.find(img => img.id === imageId)?.image_url || null;
      if (newPrimaryImageUrl) {
        setPrimaryImages(prev => ({ ...prev, [productId]: newPrimaryImageUrl }));
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการตั้งรูปหลัก');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-bgpage text-textmain px-6 py-8 grid md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <aside className="md:col-span-1 bg-white rounded-card shadow-card p-4 sticky top-4 h-fit">
        <nav className="space-y-2 text-sm">
          <button
            onClick={() => router.push('/store-dashboard')}
            className="w-full text-left block px-3 py-2 rounded-pill bg-primary text-white shadow hover:bg-primary/90 transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push('/store-products')}
            className="w-full text-left block px-3 py-2 rounded-pill hover:bg-primary/10 hover:text-primary transition"
          >
            Products
          </button>
          <button
            onClick={() => router.push('/store-orders')}
            className="w-full text-left block px-3 py-2 rounded-pill hover:bg-primary/10 hover:text-primary transition"
          >
            Orders
          </button>
          <button
            onClick={() => router.push('/addproduct')}
            className="w-full text-left block px-3 py-2 rounded-pill hover:bg-primary/10 hover:text-primary transition"
          >
            เพิ่มสินค้า
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left block px-3 py-2 rounded-pill hover:bg-red-600 hover:text-white transition"
          >
            🚪 Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <section className="md:col-span-3 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-card shadow-card p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">📦 Store Dashboard</h1>
            <p className="text-textmuted">👋 ยินดีต้อนรับคุณ <span className="font-semibold">{username}</span></p>
            <p className="text-textmuted">🏪 ร้าน: <span className="font-semibold">{storeName}</span> | 🆔 Shop ID: {shopId}</p>
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
            <p className="text-2xl font-bold">{products.filter(p => p.total_stock <= 5).length}</p>
          </div>
          <div className="bg-white rounded-card shadow-card p-4 text-center">
            <p className="text-sm text-textmuted">Hot Deal Items</p>
            <p className="text-2xl font-bold">{products.filter(p => p.status === 'hot').length}</p>
          </div>
        </div>

        {/* Products List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.length > 0 ? products.map((p) => (
            <div key={p.product_id} className="bg-white rounded-card shadow-card p-4 hover:shadow-xl transition relative">
              {p.total_stock <= 5 && (
                <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded-full font-semibold shadow">
                  Low Stock
                </span>
              )}
              <div className="flex flex-col md:flex-row gap-4">
                <img
                  src={primaryImages[p.product_id] ?? undefined}
                  alt={p.product_name ?? undefined}
                  className="w-full md:w-48 h-48 object-cover rounded-card border border-gray-200 shadow-md transition-transform hover:scale-105"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-primary">{p.product_name}</h2>
                  <p className="text-textmuted mt-1 italic">{p.product_description}</p>
                  <p className="mt-2 font-bold text-accent">💰 {p.price != null ? `฿${p.price.toFixed(2)}` : 'N/A'}</p>

                  {/* Variants */}
                  {p.product_variants && p.product_variants.length > 0 && (
                    <table className="w-full mt-4 text-sm table-auto border border-gray-200 rounded">
                      <thead className="bg-bgpage font-semibold">
                        <tr>
                          <th className="border px-2 py-1 text-left">SKU</th>
                          <th className="border px-2 py-1 text-left">ราคา</th>
                          <th className="border px-2 py-1 text-left">สต็อก</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.product_variants.map((v) => (
                          <tr key={v.variant_id} className="odd:bg-white even:bg-bgpage hover:bg-primary/10 transition">
                            <td className="border px-2 py-1">{v.sku}</td>
                            <td className="border px-2 py-1">{v.price != null ? `฿${v.price.toFixed(2)}` : '-'}</td>
                            <td className="border px-2 py-1">{v.total_stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <p className="italic text-textmuted col-span-full text-center py-20">ยังไม่มีสินค้าในร้าน</p>
          )}
        </div>
      </section>
    </div>
  );
}
