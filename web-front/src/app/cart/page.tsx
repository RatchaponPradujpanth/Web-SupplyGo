'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartUser } from '@/service/api/loadcart';
import type { CartItemWithExtra, Address } from '@/types/type';
import { removefromcart } from '@/service/api/removefromcart';
import { loadaddress } from '@/service/api/loadaddress';
import { updateCartQuantity } from '@/service/api/updateCartQuantity';
import { useToast } from '@/components/Toast';
import { MapPin, Package, AlertCircle } from 'lucide-react';
import NumericInput from '@/components/ui/NumericInput';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemWithExtra[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

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
        // โหลดที่อยู่
        const addressData = await loadaddress(token);
        setAddresses(addressData);
        if (addressData.length > 0) {
          setSelectedAddressId(addressData[0].address_id);
        }
      } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการโหลดตะกร้า:', error);
        showToast('โหลดตะกร้าไม่สำเร็จ', 'error');
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [router, showToast]);

  const handleRemoveItem = async (item: CartItemWithExtra) => {
    try {
      if (!item?.product_id) throw new Error('Missing product_id');

      await removefromcart(
        Number(item.product_id),
        item.variant_id ? Number(item.variant_id) : undefined,
        item.variant_option_ids
      );

      setCartItems(prev =>
        prev.filter(i => i.cart_item_id !== item.cart_item_id)
      );

      setTotal(prev => prev - Number(item.total_price));
      showToast('ลบสินค้าสำเร็จ', 'success');
    } catch (error) {
      console.error('❌ ลบสินค้าไม่สำเร็จ:', error);
      showToast('ไม่สามารถลบสินค้าได้ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('กรุณาเข้าสู่ระบบใหม่', 'warning');
      router.push('/login');
      return;
    }

    try {
      // เรียก API เพื่ออัปเดตจำนวนสินค้าใน backend
      await updateCartQuantity(token, {
        cart_item_id: itemId,
        quantity: newQuantity
      });

      // อัปเดต frontend state หลังจาก API สำเร็จ
      setCartItems(prev => {
        const updated = prev.map(item => {
          if (item.cart_item_id === itemId) {
            const newTotalPrice = Number(item.price_per_unit) * newQuantity;
            return { ...item, quantity: newQuantity, total_price: newTotalPrice };
          }
          return item;
        });

        const newTotal = updated.reduce(
          (acc, item) => acc + Number(item.total_price),
          0
        );
        setTotal(newTotal);

        return updated;
      });
    } catch (error) {
      console.error('❌ อัปเดตจำนวนสินค้าไม่สำเร็จ:', error);
      
      // แสดงข้อความแจ้งเตือนให้ผู้ใช้
      if (error instanceof Error && error.message.includes('เกินจำนวนในสต็อก')) {
        showToast(error.message, 'warning');
      } else {
        showToast('ไม่สามารถอัปเดตจำนวนสินค้าได้ กรุณาลองใหม่อีกครั้ง', 'error');
      }
      
      // โหลดข้อมูลตะกร้าใหม่เพื่อให้แน่ใจว่าข้อมูลถูกต้อง
      try {
        const data = await cartUser(token);
        setCartItems(data.items);
        const totalPrice = data.items.reduce(
          (acc, item) => acc + Number(item.total_price),
          0
        );
        setTotal(totalPrice);
      } catch (reloadError) {
        console.error('❌ โหลดตะกร้าใหม่ไม่สำเร็จ:', reloadError);
        showToast('โหลดตะกร้าใหม่ไม่สำเร็จ', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <p className="text-center py-10 text-gray-600">กำลังโหลด...</p>
        </main>
      </div>
    );
  }

  const subtotal = total;
  const shipping = 0; // Free shipping
  const finalTotal = subtotal + shipping;

  return (
    <div className="bg-gray-50 min-h-screen font-inter text-gray-800">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl font-semibold mb-4">ตะกร้าของฉัน</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">ไม่มีสินค้าในตะกร้า</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cart Items Table */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-sm">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th className="p-4">สินค้า</th>
                    <th className="p-4">ราคา</th>
                    <th className="p-4">จำนวน</th>
                    <th className="p-4">ราคารวม</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={item.cart_item_id} className={index > 0 ? 'border-t' : ''}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img
                                src={
                                  item.image.startsWith('http')
                                    ? item.image
                                    : `${process.env.NEXT_PUBLIC_API_URL}${item.image}`
                                }
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-gray-600 text-xs">SKU: {item.product_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">฿{Number(item.price_per_unit).toLocaleString()}</td>
                      <td className="p-4 w-24">
                        <NumericInput
                          min={1}
                          value={item.quantity}
                          onChange={(val) => handleQuantityChange(item.cart_item_id, Number(val))}
                          inputClassName="border rounded px-2 py-1 w-16 text-center"
                        />
                      </td>
                      <td className="p-4 font-semibold">฿{Number(item.total_price).toLocaleString()}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleRemoveItem(item)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          ลบสินค้า
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Sidebar */}
            <aside className="bg-white rounded-lg shadow-sm p-5 h-max">
              <h2 className="font-semibold text-lg">ราคารวม</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>สรุปยอดชำระ</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าจัดส่ง</span>
                  <span className="text-green-600 font-medium">ฟรี</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>ยอดรวม</span>
                  <span>฿{finalTotal.toLocaleString()}</span>
                </div>
              </div>
              {/* เลือกที่อยู่จัดส่ง */}
              {addresses.length > 0 ? (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> ที่อยู่จัดส่ง
                  </label>
                  <select
                    value={selectedAddressId ?? ''}
                    onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {addresses.map((addr) => (
                      <option key={addr.address_id} value={addr.address_id}>
                        {addr.firstname} {addr.lastname} - {addr.house_number} {addr.sub_district} {addr.district} {addr.province}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">ยังไม่มีที่อยู่จัดส่ง</p>
                    <button
                      onClick={() => router.push('/profile?tab=addresses')}
                      className="text-sm text-blue-600 hover:underline mt-1"
                    >
                      เพิ่มที่อยู่ใหม่
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (!selectedAddressId) {
                    showToast('กรุณาเลือกที่อยู่จัดส่ง', 'warning');
                    return;
                  }
                  router.push(`/checkout?addressId=${selectedAddressId}`);
                }}
                disabled={addresses.length === 0}
                className={`block mt-4 w-full text-center rounded-full py-3 transition-colors ${
                  addresses.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                ไปหน้าชำระเงิน
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}