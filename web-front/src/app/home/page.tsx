'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadUsername, fetchUserRole, loaduserproduct, Product, addtocart } from '@/service/apis';

export default function UserDashboardPage() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const userRole = await fetchUserRole(token);
        setRole(userRole);

        if (userRole === 'store') {
          router.push('/dashboard');
          return;
        }

        const name = await loadUsername(token);
        setUsername(name);

        const userProducts = await loaduserproduct();
        setProducts(userProducts);
      } catch (err) {
        console.error("🚫 Error loading user dashboard:", err);
        router.push('/');
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  // 🔁 เปลี่ยน handleAddToCart
const handleAddToCart = async (product: Product) => {
  try {
    await addtocart(product.product_id, 1); // ส่งแค่ 2 ค่า

    alert('✅ เพิ่มสินค้าลงตะกร้าแล้ว');
  } catch (err) {
    console.error('❌ ไม่สามารถเพิ่มสินค้าลงตะกร้าได้:', err);
    alert('เกิดข้อผิดพลาดขณะเพิ่มสินค้า');
  }
};


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-400 to-blue-600 text-white p-6">
      <h1 className="text-4xl font-bold mb-4">Hello User 👤</h1>
      {username ? (
        <p className="text-2xl bg-black bg-opacity-30 px-6 py-3 rounded-lg shadow mb-6">
          ยินดีต้อนรับคุณ <span className="font-semibold">{username}</span>
        </p>
      ) : (
        <p className="italic">กำลังโหลดข้อมูลผู้ใช้...</p>
      )}

      <div className="w-full max-w-4xl bg-white bg-opacity-80 text-black rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">📋 สินค้าของคุณ</h2>
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
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold">{product.product_name}</h3>
                  <p className="italic text-gray-700 text-sm">{product.product_description}</p>
                  <p className="mt-2 font-semibold text-green-700">
                    💰 ราคา: ฿{Number(product.price).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded shadow"
                >
                  ➕ เพิ่มลงตะกร้า
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-gray-600 text-center">ยังไม่มีสินค้าในร้าน</p>
        )}
      </div>

      <div className="text-right mt-6">
        <button
          onClick={() => router.push('/cart')}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg shadow transition"
        >
          🛒 ไปดูตะกร้าสินค้า
        </button>
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
