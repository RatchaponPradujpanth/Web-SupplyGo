'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCartSummary , CheckoutItem } from '@/service/apis';

export default function CheckoutPage() {
  const [summary, setSummary] = useState<{ cart_id: number; items: CheckoutItem[]; totalAmount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("กรุณาเข้าสู่ระบบ");
        router.push('/');
        return;
      }

      try {
        const data = await getCartSummary(token);
        setSummary(data);
      } catch (err) {
        console.error(err);
        alert("โหลดข้อมูลสรุปตะกร้าไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [router]);

  if (loading) return <div className="p-6 text-gray-600">กำลังโหลด...</div>;

  if (!summary || summary.items.length === 0)
    return <div className="p-6 text-gray-500">ยังไม่มีสินค้าที่จะชำระเงิน</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">💳 สรุปการชำระเงิน</h1>
      <ul className="space-y-4">
        {summary.items.map((item) => (
          <li key={item.cart_item_id} className="border p-4 rounded">
            <p>สินค้า: <strong>{item.product_name}</strong></p>
            <p>ร้าน: {item.shop_name}</p>
            <p>จำนวน: {item.quantity} × ฿{Number(item.price_per_unit).toFixed(2)}</p>
            <p>รวมรายการ: ฿{Number(item.total_price).toFixed(2)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-right font-bold text-xl text-blue-600">
        รวมทั้งสิ้น: ฿{Number(summary.totalAmount).toFixed(2)}
      </div>

      <div className="mt-4 text-right">
        <button
          onClick={() => router.push('/payment')}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          ➡ ไปหน้าชำระเงิน
        </button>
      </div>
    </div>
  );
}
