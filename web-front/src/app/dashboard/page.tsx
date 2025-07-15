'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadUsername, loadproduct, loadstorename, regisstripe } from '@/service/apis';
import { Product } from '@/service/apis';
import { jwtDecode } from 'jwt-decode';

type DecodedToken = {
  user_id: number;
  role: string;
  shop_id?: number;
};

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [storeName, setStoreName] = useState("");
  const [shopId, setShopId] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stripeConnected, setStripeConnected] = useState(false); // <-- เพิ่มสถานะนี้
  const router = useRouter();

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("📦 โหลด Dashboard — token:", token);

      if (token) {
        const decoded = jwtDecode<DecodedToken>(token);
        setRole(decoded.role);

        const name = await loadUsername(token);
        setUsername(name);

        if (decoded.role === 'store') {
          const store = await loadstorename(token);
          console.log("🏪 store:", store);
          setStoreName(store.shopname);
          setShopId(store.shop_id);
          // ตรวจสอบ stripe_account_id ว่ามีไหม
          setStripeConnected(Boolean(store.stripe_account_id));
        }
      } else {
        console.warn("🚫 ไม่มี token");
      }

      const productList = await loadproduct();
      setProducts(productList);
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-400 to-purple-600 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">Hello from dashboard</h1>

      {username ? (
        <div className="text-center mb-6">
          <p className="text-2xl bg-black bg-opacity-20 rounded-lg px-6 py-3 shadow-lg">
            ยินดีต้อนรับคุณ <span className="font-semibold">{username}</span>
          </p>

          {role === 'store' && storeName && (
            <div className="text-xl mt-2 bg-black bg-opacity-10 px-4 py-2 rounded shadow">
              ร้านของคุณชื่อ: <span className="font-semibold">{storeName}</span><br />
              รหัสร้าน (Shop ID): <span className="font-semibold">{shopId}</span>

              {stripeConnected ? (
                <p className="mt-4 text-green-400 font-semibold">
                  ✅ คุณเชื่อมต่อบัญชี Stripe เรียบร้อยแล้ว
                </p>
              ) : (
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('token');
                      if (token) {
                        await regisstripe(token);
                      } else {
                        alert("ยังไม่ได้เข้าสู่ระบบ");
                      }
                    }}
                    className="mt-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                  >
                    เชื่อมบัญชี Stripe
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-lg italic">กำลังโหลดข้อมูลผู้ใช้...</p>
      )}

      <div className="w-full max-w-4xl bg-black bg-opacity-10 rounded-lg p-6 shadow-lg mt-4">
        <h2 className="text-2xl font-semibold mb-4">รายการสินค้า</h2>
        {products.length > 0 ? (
          <ul className="space-y-4">
            {products.map((product) => (
              <li key={product.product_id} className="p-4 bg-black bg-opacity-20 rounded-lg shadow">
                <h3 className="text-xl font-bold">{product.product_name}</h3>
                <p className="text-sm italic">{product.product_description}</p>
                <p className="font-semibold mt-1">ราคา: ฿{Number(product.price).toFixed(2)}</p>
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.product_name}
                    className="mt-2 w-40 rounded"
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic">ไม่มีสินค้าที่แสดง</p>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="mt-8 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition"
      >
        Logout / Clear Token
      </button>
    </div>
  );
}
