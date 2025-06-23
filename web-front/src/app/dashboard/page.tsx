'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadUsername, loadproduct } from '@/service/apis';
import { Product } from '@/service/apis';

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  // ✅ ฟังก์ชันโหลดข้อมูลทั้งชื่อผู้ใช้ + สินค้า
  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      // โหลดชื่อผู้ใช้ (ใช้ token ถ้ามี)
      if (token) {
        const name = await loadUsername(token);
        setUsername(name);
      }

      // โหลดสินค้า (ไม่ใช้ token)
      const productList = await loadproduct();
      console.log("✅ Products loaded in dashboard:", productList);
      setProducts(productList);
      
    } catch (error) {
      console.log("Error loading dashboard data:", error);
    }
  };

  // ✅ เรียก loadDashboardData ที่เขียนไว้ด้านบน
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
        <p className="text-2xl bg-black bg-opacity-20 rounded-lg px-6 py-3 shadow-lg mb-6">
          ยินดีต้อนรับคุณ <span className="font-semibold">{username}</span>
        </p>
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
