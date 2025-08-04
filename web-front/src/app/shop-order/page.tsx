'use client';

import { useEffect, useState } from 'react';
import { getShopOrderHistory, updateTrackingNumber, updatestatus } from '@/service/apis';

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

export default function ShopOrderHistoryPage() {
  const [data, setData] = useState<OrderHistory | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<{ [key: number]: string }>({});
  const [statusInputs, setStatusInputs] = useState<{ [key: number]: string }>({});
  const [savingIds, setSavingIds] = useState<number[]>([]);
  const [trackingFilter, setTrackingFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setLoading(true);
      try {
        const res = await getShopOrderHistory(token, trackingFilter.trim() || undefined);
        setData(res);

        // เตรียม initial state ของ tracking และ status input
        const initialTracking: { [key: number]: string } = {};
        const initialStatus: { [key: number]: string } = {};
        res.order_shops.forEach(os => {
          initialTracking[os.order_shop_id] = os.tracking_number ?? '';
          initialStatus[os.order_shop_id] = os.status;
        });

        setTrackingInputs(initialTracking);
        setStatusInputs(initialStatus);
      } catch (err) {
        console.error('❌ Error loading data', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trackingFilter]);

  const handleSaveTracking = async (orderShopId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const trackingNumber = trackingInputs[orderShopId];
    if (!trackingNumber || trackingNumber.trim() === '') return;

    try {
      setSavingIds(prev => [...prev, orderShopId]);
      await updateTrackingNumber(token, orderShopId, trackingNumber);
      alert('อัปเดตเลขพัสดุเรียบร้อย');

      // รีโหลดข้อมูล
      const res = await getShopOrderHistory(token, trackingFilter.trim() || undefined);
      setData(res);

      const newTracking: { [key: number]: string } = {};
      const newStatus: { [key: number]: string } = {};
      res.order_shops.forEach(os => {
        newTracking[os.order_shop_id] = os.tracking_number ?? '';
        newStatus[os.order_shop_id] = os.status;
      });
      setTrackingInputs(newTracking);
      setStatusInputs(newStatus);
    } catch (err) {
      console.error('❌ update tracking failed', err);
      alert('เกิดข้อผิดพลาดในการอัปเดตเลขพัสดุ');
    } finally {
      setSavingIds(prev => prev.filter(id => id !== orderShopId));
    }
  };

  const handleStatusChange = (orderShopId: number, value: string) => {
    setStatusInputs(prev => ({ ...prev, [orderShopId]: value }));
  };

  const handleSaveStatus = async (orderShopId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const newStatus = statusInputs[orderShopId];
    if (!newStatus) return;

    try {
      setSavingIds(prev => [...prev, orderShopId]);
      await updatestatus(token, orderShopId, newStatus);
      alert('อัปเดตสถานะสำเร็จ');

      const res = await getShopOrderHistory(token, trackingFilter.trim() || undefined);
      setData(res);

      const newStatusState: { [key: number]: string } = {};
      const newTracking: { [key: number]: string } = {};
      res.order_shops.forEach(os => {
        newStatusState[os.order_shop_id] = os.status;
        newTracking[os.order_shop_id] = os.tracking_number ?? '';
      });
      setStatusInputs(newStatusState);
      setTrackingInputs(newTracking);
    } catch (err) {
      console.error('❌ update status failed', err);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setSavingIds(prev => prev.filter(id => id !== orderShopId));
    }
  };

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ประวัติคำสั่งซื้อร้านค้า</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="ค้นหาเลขพัสดุ เช่น TH123..."
          value={trackingFilter}
          onChange={(e) => setTrackingFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 w-full max-w-sm"
        />
      </div>

      {(!data || data.order_shops.length === 0) && (
        <p className="text-gray-500">ไม่มีคำสั่งซื้อ</p>
      )}

      {data?.order_shops.map((orderShop) => {
        const isSaving = savingIds.includes(orderShop.order_shop_id);
        // หา order ของ orderShop
        const order = data.orders.find(o => o.order_id === orderShop.order_id);
        // หา address ของ order
        const address = order ? data.addresses.find(a => a.address_id === order.address_id) : null;
        // หารายการสินค้าของ orderShop
        const items = data.order_items.filter(item => item.order_shop_id === orderShop.order_shop_id);

        return (
          <div key={orderShop.order_shop_id} className="border rounded-xl p-4 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">คำสั่งซื้อ #{orderShop.order_shop_id}</h2>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={trackingInputs[orderShop.order_shop_id] || ''}
                  onChange={(e) => setTrackingInputs(prev => ({ ...prev, [orderShop.order_shop_id]: e.target.value }))}
                  placeholder="เลขพัสดุ"
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-36"
                  disabled={isSaving}
                />
                <button
                  onClick={() => handleSaveTracking(orderShop.order_shop_id)}
                  disabled={isSaving}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกเลขพัสดุ'}
                </button>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm font-medium block">สถานะ:</label>
              <select
                value={statusInputs[orderShop.order_shop_id] || ''}
                onChange={(e) => handleStatusChange(orderShop.order_shop_id, e.target.value)}
                disabled={isSaving}
                className="border px-2 py-1 rounded text-sm w-36"
              >
                <option value="Pending">รอดำเนินการ</option>
                <option value="Shipped">กำลังจัดส่ง</option>
                <option value="Delivered">จัดส่งสำเร็จ</option>
                <option value="Cancelled">ยกเลิก</option>
              </select>
              <button
                onClick={() => handleSaveStatus(orderShop.order_shop_id)}
                disabled={isSaving}
                className="ml-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                {isSaving ? 'กำลังบันทึก...' : 'อัปเดตสถานะ'}
              </button>
            </div>

            <div className="mb-2 text-sm text-gray-700">
              <p>ราคารวม: {orderShop.subtotal} บาท</p>
            </div>

            <div className="mb-2">
              <h3 className="font-medium text-sm">สินค้าที่สั่ง:</h3>
              <ul className="list-disc list-inside text-sm text-gray-800">
                {items.map((item, i) => (
                  <li key={`${item.order_item_id ?? item.product_id}-${i}`}>
                    สินค้า #{item.product_id} - {item.quantity} ชิ้น x {item.price_per_unit} = {item.total_price} บาท
                  </li>
                ))}
              </ul>
            </div>

            {address && (
              <div className="text-sm text-gray-600">
                <h4 className="font-medium">ที่อยู่จัดส่ง:</h4>
                <p>{address.firstname} {address.lastname}, {address.phone_number}</p>
                <p>
                  {address.house_number}, {address.street}, {address.sub_district}, {address.district}, {address.province}, {address.postal_code}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
