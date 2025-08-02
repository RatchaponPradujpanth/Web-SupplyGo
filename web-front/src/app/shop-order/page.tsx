'use client';

import { useEffect, useState } from 'react';
import { getShopOrderHistory, updateTrackingNumber } from '@/service/apis';

interface Order {
  order_id: number;
  address_id: number;
  user_id: number;
}

interface OrderShop {
  order_shop_id: number;
  shop_id: number;
  subtotal: number;
  status: string;
  tracking_number?: string;
  order_id: number;
}

interface OrderItem {
  order_item_id: number;
  order_shop_id: number;
  product_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
}

interface Address {
  address_id: number;
  firstname: string;
  lastname: string;
  phone_number: string;
  house_number: string;
  street: string;
  sub_district: string;
  district: string;
  province: string;
  postal_code: string;
}

interface OrderHistory {
  orders: Order[];
  order_shops: OrderShop[];
  order_items: OrderItem[];
  addresses: Address[];
}

const ShopOrderPage = () => {
  const [data, setData] = useState<OrderHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState('');
  const [trackingInputs, setTrackingInputs] = useState<{ [key: number]: string }>({});
  const [savingIds, setSavingIds] = useState<number[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setLoading(true);
      try {
        const res = await getShopOrderHistory(token, tracking.trim() || undefined);
        setData(res);

        if (res) {
          const initialTracking: { [key: number]: string } = {};
          res.order_shops.forEach(os => {
            initialTracking[os.order_shop_id] = os.tracking_number ?? '';
          });
          setTrackingInputs(initialTracking);
        }
      } catch (e) {
        console.error('❌ ดึงข้อมูลร้านค้าไม่สำเร็จ', e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [tracking]);

  const handleTrackingChange = (orderShopId: number, value: string) => {
    setTrackingInputs(prev => ({ ...prev, [orderShopId]: value }));
  };

  const handleSaveTracking = async (orderShopId: number) => {
    const token = localStorage.getItem('token');
    // Debug token ก่อนส่ง
  console.log('🔑 Raw token from localStorage:', token);
  console.log('🔑 Token exists:', !!token);
  console.log('🔑 Token length:', token?.length);
  
    if (!token) return;

    const newTrackingNumber = trackingInputs[orderShopId];
    if (newTrackingNumber === undefined) return;

    try {
      
      setSavingIds(prev => [...prev, orderShopId]);
      await updateTrackingNumber(token, orderShopId, newTrackingNumber);
      alert('บันทึกเลขพัสดุสำเร็จ');

      // รีเฟรชข้อมูลใหม่
      const res = await getShopOrderHistory(token, tracking.trim() || undefined);
      setData(res);

      // อัปเดต trackingInputs ใหม่
      if (res) {
        const initialTracking: { [key: number]: string } = {};
        res.order_shops.forEach(os => {
          initialTracking[os.order_shop_id] = os.tracking_number ?? '';
        });
        setTrackingInputs(initialTracking);
      }
    } catch (e) {
      console.error('❌ บันทึกเลขพัสดุไม่สำเร็จ', e);
      alert('เกิดข้อผิดพลาดในการบันทึกเลขพัสดุ');
    } finally {
      setSavingIds(prev => prev.filter(id => id !== orderShopId));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ประวัติคำสั่งซื้อของร้าน</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="ค้นหาเลขพัสดุ เช่น TH123..."
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 w-full max-w-sm"
        />
      </div>

      {loading ? (
        <p>⏳ กำลังโหลดข้อมูล...</p>
      ) : !data || data.order_shops.length === 0 ? (
        <p className="text-gray-500">ไม่มีคำสั่งซื้อ</p>
      ) : (
        <div className="space-y-6">
          {data.order_shops.map((orderShop) => {
            const order = data.orders.find((o) => o.order_id === orderShop.order_id);
            const address = order ? data.addresses.find((a) => a.address_id === order.address_id) : null;
            const items = data.order_items.filter((item) => item.order_shop_id === orderShop.order_shop_id);
            const isSaving = savingIds.includes(orderShop.order_shop_id);

            return (
              <div key={orderShop.order_shop_id} className="border rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">คำสั่งซื้อ #{orderShop.order_shop_id}</h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={trackingInputs[orderShop.order_shop_id] || ''}
                      onChange={(e) => handleTrackingChange(orderShop.order_shop_id, e.target.value)}
                      placeholder="เลขพัสดุ"
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-36"
                      disabled={isSaving}
                    />
                    <button
                      onClick={() => handleSaveTracking(orderShop.order_shop_id)}
                      disabled={isSaving}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </div>

                <div className="mb-2 text-sm text-gray-700">
                  <p>สถานะ: {orderShop.status}</p>
                  <p>ราคารวม: {orderShop.subtotal} บาท</p>
                </div>

                <div className="mb-2">
                  <h3 className="font-medium text-sm">สินค้าที่สั่ง:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-800">
                    {items.map((item, index) => (
                      <li key={`${item.order_item_id ?? item.product_id}-${index}`}>
                        สินค้า #{item.product_id} - {item.quantity} ชิ้น x {item.price_per_unit} = {item.total_price} บาท
                      </li>
                    ))}
                  </ul>
                </div>

                {address && (
                  <div className="text-sm text-gray-600">
                    <h4 className="font-medium">ที่อยู่จัดส่ง:</h4>
                    <p>
                      {address.firstname} {address.lastname}, {address.phone_number}
                    </p>
                    <p>
                      {address.house_number}, {address.street}, {address.sub_district}, {address.district},{' '}
                      {address.province}, {address.postal_code}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShopOrderPage;
