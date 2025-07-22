'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadUsername,
  loadproduct,
  loadstorename,
  regisstripe,
  fetchUserRole,
} from '@/service/apis';
import { Product } from '@/service/apis';

export default function StoreDashboardPage() {
  const [username, setUsername] = useState('');
  const [storeName, setStoreName] = useState('');
  const [shopId, setShopId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stripeConnected, setStripeConnected] = useState(false);
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
      setStoreName(store.shopname);
      setShopId(store.shop_id);
      setStripeConnected(Boolean(store.stripe_account_id));

      const productList = await loadproduct(token);
      setProducts(productList);
    };

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4">📦 Store Dashboard</h1>

      <div className="bg-white bg-opacity-80 text-black rounded-lg shadow-lg p-6 w-full max-w-4xl mb-6 text-center">
        <p className="text-xl">👋 ยินดีต้อนรับคุณ <span className="font-semibold">{username}</span></p>
        <p className="text-lg mt-2">🏪 ร้าน: <span className="font-semibold">{storeName}</span></p>
        <p>🆔 Shop ID: {shopId}</p>

        {stripeConnected ? (
          <p className="text-green-300 mt-4 font-semibold">✅ เชื่อมต่อ Stripe แล้ว</p>
        ) : (
          <button
            onClick={() => regisstripe(localStorage.getItem('token')!)}
            className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
          >
            ➕ เชื่อมบัญชี Stripe
          </button>
        )}
      </div>

      <div className="w-full max-w-4xl bg-white bg-opacity-80 text-black rounded-lg p-6 shadow-lg">
  <h2 className="text-2xl font-semibold mb-4">📋 รายการสินค้า</h2>

  {products.length > 0 ? (
    <ul className="space-y-4">
      {products.map((product) => (
        <li
          key={product.product_id}
          className="bg-white bg-opacity-90 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 shadow"
        >
          {product.image && (
            <img
              src={product.image}
              alt={product.product_name}
              className="w-32 h-32 object-cover rounded"
            />
          )}
          <div className="text-left">
            <h3 className="text-xl font-bold">{product.product_name}</h3>
            <p className="italic text-sm text-gray-700">{product.product_description}</p>
            <p className="mt-2 font-semibold text-green-700">
              💰 ราคา: ฿{Number(product.price).toFixed(2)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p className="italic text-gray-600 text-center">ยังไม่มีสินค้าในร้าน</p>
  )}
</div>


      <div className="mt-6">
        <button
          onClick={() => router.push('/addproduct')}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg shadow transition"
        >
          ➕ เพิ่มสินค้า
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition"
      >
        🚪 Logout / ออกจากระบบ
      </button>
    </div>
  );
}
