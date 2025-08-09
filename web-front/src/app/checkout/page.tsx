'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCartSummary } from '@/service/api/getCartSummary';
import type { CheckoutItem, CreateOrderPayload } from '@/types/type';
import { loadaddress } from '@/service/api/loadaddress';
import type { Address } from '@/types/type';
import { createOrder } from '@/service/api/createorder'; 

export default function CheckoutPage() {
  const [summary, setSummary] = useState<{ cart_id: number; items: CheckoutItem[]; totalAmount: number } | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("กรุณาเข้าสู่ระบบ");
        router.push('/');
        return;
      }

      try {
        const data = await getCartSummary(token);
        setSummary(data);

        const addrData = await loadaddress(token);
        setAddresses(addrData);

        if (addrData.length > 0) {
          setSelectedAddress(addrData[0].address_id);
        }
      } catch (err) {
        console.error(err);
        alert("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <div className="p-6 text-gray-600">กำลังโหลด...</div>;

  if (!summary || summary.items.length === 0)
    return <div className="p-6 text-gray-500">ยังไม่มีสินค้าที่จะชำระเงิน</div>;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // คำนวณยอดรวมทั้งหมด
  const totalAmount = summary.items.reduce(
    (sum, item) => sum + Number(item.total_price),
    0
  );

  // คำนวณ subtotal แยกตามร้าน (shop_name)
  const subtotalsByShop = summary.items.reduce((acc, item) => {
    const shop = item.shop_name;
    if (!acc[shop]) acc[shop] = 0;
    acc[shop] += Number(item.total_price);
    return acc;
  }, {} as Record<string, number>);

if (selectedAddress === null) {
  alert('กรุณาเลือกที่อยู่จัดส่ง');
  return;
}

  // เตรียม payload ให้ตรง type ของ backend (แก้ชื่อ items เป็น cartItems ถ้าต้องการ)
  const createOrderPayload: CreateOrderPayload = {
    addressId: selectedAddress,
    totalAmount,
    cartItems: summary.items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      total_price: item.total_price,
      shopId: item.shop_id,
      variant_option_id: item.variant_option_id || null,
    })),
  };

  const handleCreateOrder = async () => {
    if (!token) {
      alert('กรุณาเข้าสู่ระบบ');
      router.push('/');
      return;
    }
    if (!selectedAddress) {
      alert('กรุณาเลือกที่อยู่จัดส่ง');
      return;
    }

    try {
      setCreatingOrder(true);
      const response = await createOrder(token, createOrderPayload);
      alert('สร้างคำสั่งซื้อสำเร็จ');
      router.push(`/payment?addressId=${selectedAddress}&orderId=${response.order_id}`);
    } catch (error) {
      alert('สร้างคำสั่งซื้อไม่สำเร็จ');
      console.error(error);
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">💳 สรุปการชำระเงิน</h1>

      <div className="mb-6">
        <label className="block mb-2 font-semibold">📍 เลือกที่อยู่จัดส่ง</label>
        <select
          value={selectedAddress ?? ''}
          onChange={(e) => setSelectedAddress(Number(e.target.value))}
          className="border rounded px-3 py-2 w-full"
        >
          {addresses.map((addr) => (
            <option key={addr.address_id} value={addr.address_id}>
              {addr.firstname} {addr.lastname} - {addr.phone_number} | {addr.house_number} {addr.street} {addr.sub_district} {addr.district} {addr.province} {addr.postal_code}
            </option>
          ))}
        </select>
      </div>

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

      <div className="mt-6 border-t pt-4">
        {Object.entries(subtotalsByShop).map(([shopName, subtotal]) => (
          <div key={shopName} className="mb-2 flex justify-between">
            <span className="font-semibold">{shopName}</span>
            <span>ยอดรวมร้าน: ฿{subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-right font-bold text-xl text-blue-600">
        รวมทั้งสิ้น: ฿{totalAmount.toFixed(2)}
      </div>

      <div className="mt-4 text-right">
        <button
          onClick={handleCreateOrder}
          disabled={creatingOrder}
          className={`px-6 py-2 rounded text-white ${creatingOrder ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} transition`}
        >
          {creatingOrder ? 'กำลังสร้างคำสั่งซื้อ...' : '➡ สร้างคำสั่งซื้อและไปหน้าชำระเงิน'}
        </button>
      </div>
    </div>
  );
}
