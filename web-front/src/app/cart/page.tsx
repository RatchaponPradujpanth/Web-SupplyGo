'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartUser } from '@/service/api/loadcart';
import type { CartItemWithExtra } from '@/types/type';
import { removefromcart } from '@/service/api/removefromcart';  // 👈 ตรวจสอบให้แน่ใจว่า import ถูกต้อง

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemWithExtra[]>([]);
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
        const data = await cartUser(token);
        setCartItems(data.items);

        const totalPrice = data.items.reduce(
          (acc, item) => acc + Number(item.total_price),
          0
        );
        setTotal(totalPrice);
      } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการโหลดตะกร้า:', error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

const handleRemoveItem = async (item: CartItemWithExtra) => {
  try {
    // Debug logging
    console.log("📦 Debug - Full item object:", JSON.stringify(item, null, 2));
    console.log("🔑 Debug - product_id type:", typeof item.product_id);
    
    if (!item || typeof item !== 'object') {
      throw new Error("Invalid item object");
    }

    if (!item.product_id) {
      console.error("❌ Product ID is missing from item:", item);
      throw new Error("Missing product_id");
    }

    // เรียก API
    await removefromcart(
      Number(item.product_id),
      item.variant_id ? Number(item.variant_id) : undefined,
      item.variant_option_ids
    );
    
    // ถ้าลบสำเร็จค่อยอัพเดท UI
    setCartItems(prev => prev.filter(i => i.cart_item_id !== item.cart_item_id));
    setTotal(prev => prev - Number(item.total_price));
    
  } catch (error) {
    console.error("❌ ลบสินค้าไม่สำเร็จ:", error);
    alert("ไม่สามารถลบสินค้าได้ กรุณาลองใหม่อีกครั้ง");
  }
};
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          🛒 ตะกร้าสินค้าของคุณ
        </h1>

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
    <div className="flex-shrink-0">
      {item.image ? (
        <img
          src={item.image}
          alt={item.product_name}
          className="w-40 h-40 object-cover rounded"
        />
      ) : (
        <div className="w-40 h-40 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      )}
    </div>

    <div className="ml-6 flex-grow">
      <h3 className="text-lg font-semibold text-gray-800">
        {item.product_name}
      </h3>

      {item.variant_info && (
        <p className="text-sm text-gray-600 mt-1">
          {item.variant_info}
        </p>
      )}

      <p className="text-sm text-gray-500 mt-1">
        ร้าน: {item.shop_name}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-blue-600 font-medium">
          ฿{Number(item.price_per_unit).toLocaleString()}
        </span>
        <span className="text-gray-600">
          จำนวน: {item.quantity}
        </span>
        <span className="text-blue-700 font-semibold">
          รวม: ฿{Number(item.total_price).toLocaleString()}
        </span>
      </div>

      {/* 🔻 ปุ่มลบ */}
      <button
        className="mt-2 text-red-600 text-sm hover:underline"
        onClick={() => handleRemoveItem(item)}
      >
        ❌ ลบสินค้าออก
      </button>
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
