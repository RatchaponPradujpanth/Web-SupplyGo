'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/service/apis';

interface CartItem {
  cart_item_id: number;
  product_name: string;
  shop_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  image: string;
}

interface CartResponse {
  cart_id: number;
  items: CartItem[];
}



export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCart = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/cart`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // ไม่ต้อง alert แค่ log พอ
      //console.error('ไม่สามารถโหลดข้อมูลตะกร้าได้');
      setCartItems([]);
      return;
    }

    const data: CartResponse = await response.json();
    setCartItems(data.items);

    const totalPrice = data.items.reduce(
      (acc, item) => acc + Number(item.total_price),
      0
    );
    setTotal(totalPrice);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการโหลดตะกร้า:', error);
  } finally {
    setLoading(false);
  }
}

    fetchCart();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">🛒 ตะกร้าสินค้าของคุณ</h1>

        {loading ? (
          <p className="text-gray-600">⏳ กำลังโหลด...</p>
        ) : cartItems.length === 0 ? (
          <p className="text-gray-500">ยังไม่มีสินค้าที่อยู่ในตะกร้า</p>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.cart_item_id}
                className="flex items-center bg-gray-50 p-4 rounded-lg shadow-sm"
              >
                <img
  src={item.image ?? ''}  // ใช้ค่า image ที่ได้จาก backend ตรง ๆ เลย
  alt={item.product_name}
  className="mt-2 w-40 rounded"
/>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800">{item.product_name}</h2>
                  <p className="text-sm text-gray-600">ร้าน: {item.shop_name}</p>
                  <p className="text-sm text-gray-600">
                    จำนวน: {item.quantity} × ฿{Number(item.price_per_unit).toFixed(2)}
                  </p>
                  <p className="font-semibold text-gray-800">
                    รวม: ฿{Number(item.total_price).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            <div className="mt-6 text-right text-xl font-bold text-blue-700">
              ยอดรวมทั้งหมด: ฿{total.toFixed(2)}
            </div>

            <div className="text-right">
              <button
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
                onClick={() => router.push('/checkout')}
              >
                ➡ ไปหน้าชำระเงิน
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
