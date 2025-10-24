'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCartSummary } from '@/service/api/getCartSummary';
import type { CheckoutItem, CreateOrderPayload } from '@/types/type';
import { loadaddress } from '@/service/api/loadaddress';
import type { Address } from '@/types/type';
import { createOrder } from '@/service/api/createorder'; 

export default function CheckoutPage() {
  const [summary, setSummary] = useState<{ cart_id: number; items: CheckoutItem[]; totalAmount: number } | null>(null);
  const [selectedAddressData, setSelectedAddressData] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressId = searchParams.get('addressId');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("กรุณาเข้าสู่ระบบ");
        router.push('/');
        return;
      }

      if (!addressId) {
        alert("กรุณาเลือกที่อยู่จัดส่ง");
        router.push('/cart');
        return;
      }

      try {
        const data = await getCartSummary(token);
        console.log("Cart summary data:", data);

        // เช็คว่ามี product_id และ variant options จริงไหมในข้อมูล
        if (data?.items?.length) {
          data.items.forEach((item: CheckoutItem, index: number) => {
            console.log(`Item ${index + 1}:`, {
              product_id: item.product_id,
              variant_id: item.variant_id,
              variant_options: item.variant_options
            });
          });
        }

        setSummary(data);

        // โหลดที่อยู่ที่เลือก
        const addrData = await loadaddress(token);
        const selectedAddr = addrData.find(addr => addr.address_id === Number(addressId));
        if (selectedAddr) {
          setSelectedAddressData(selectedAddr);
        } else {
          alert("ไม่พบที่อยู่ที่เลือก");
          router.push('/cart');
          return;
        }
      } catch (err) {
        console.error(err);
        alert("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, addressId]);

  if (loading) return <div className="p-6 text-gray-600">กำลังโหลด...</div>;

  if (!summary || summary.items.length === 0)
    return <div className="p-6 text-gray-500">ยังไม่มีสินค้าที่จะชำระเงิน</div>;

  if (!selectedAddressData)
    return <div className="p-6 text-gray-500">ไม่พบที่อยู่จัดส่ง</div>;

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

  // Log important state before render
  console.log("Selected address:", selectedAddressData);
  console.log("Total amount:", totalAmount);
  console.log("Subtotals by shop:", subtotalsByShop);

  // เตรียม payload ให้ตรง type ของ backend (แก้ไขตาม API ใหม่)
  const createOrderPayload: CreateOrderPayload = {
    addressId: Number(addressId),
    totalAmount,
    cartItems: summary.items.map(item => {
      console.log("Processing item for payload:", {
        productId: item.product_id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        shopId: item.shop_id,
        variant_id: item.variant_id,
        variant_options: item.variant_options,
        total_price: item.total_price,
      });

      return {
        productId: item.product_id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        shopId: item.shop_id,
        variant_id: item.variant_id || null, // เพิ่ม variant_id
        variant_option_ids: item.variant_options?.map(vo => vo.variant_option_id) || [], // แก้เป็น array
        total_price: item.total_price,
      };
    }),
  };

  const handleCreateOrder = async () => {
    if (!token) {
      alert('กรุณาเข้าสู่ระบบ');
      router.push('/');
      return;
    }

    console.log("Sending createOrderPayload:", createOrderPayload);

    try {
      setCreatingOrder(true);
      const response = await createOrder(token, createOrderPayload);
      alert('สร้างคำสั่งซื้อสำเร็จ');
      router.push(`/payment?addressId=${addressId}&orderId=${response.order_id}`);
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

      {/* แสดงที่อยู่ที่เลือก (ไม่สามารถแก้ไขได้) */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📍</span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">ที่อยู่จัดส่ง</h3>
            <p className="text-gray-700">
              {selectedAddressData.firstname} {selectedAddressData.lastname}
            </p>
            <p className="text-gray-600 text-sm">
              📞 {selectedAddressData.phone_number}
            </p>
            <p className="text-gray-700 mt-1">
              {selectedAddressData.house_number} {selectedAddressData.street} {selectedAddressData.sub_district} {selectedAddressData.district} {selectedAddressData.province} {selectedAddressData.postal_code}
            </p>
          </div>
          <button
            onClick={() => router.push('/cart')}
            className="text-sm text-blue-600 hover:underline"
          >
            เปลี่ยน
          </button>
        </div>
      </div>

      <ul className="space-y-4">
        {summary.items.map((item) => (
          <li key={item.cart_item_id} className="border p-4 rounded">
            <p>สินค้า: <strong>{item.product_name}</strong></p>
            <p>ร้าน: {item.shop_name}</p>
            <p>จำนวน: {item.quantity} × ฿{Number(item.price_per_unit).toFixed(2)}</p>
            <p>รวมรายการ: ฿{Number(item.total_price).toFixed(2)}</p>
            
            {/* แสดง variant options ถ้ามี */}
            {item.variant_options && item.variant_options.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-700 mb-1">ตัวเลือกสินค้า:</p>
                <div className="flex flex-wrap gap-1">
                  {item.variant_options.map(vo => (
                    <span
                      key={vo.variant_option_id}
                      className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {vo.option_name}: {vo.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* แสดง variant information ถ้ามี */}
            {item.variant && (
              <div className="mt-2 text-sm text-gray-600">
                {item.variant.sku && <p>SKU: {item.variant.sku}</p>}
                {item.variant.stock_quantity !== undefined && (
                  <p>คงเหลือ: {item.variant.stock_quantity} ชิ้น</p>
                )}
              </div>
            )}
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