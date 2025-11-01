'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCartSummary } from '@/service/api/getCartSummary';
import type { CheckoutItem, CreateOrderPayload } from '@/types/type';
import { loadaddress } from '@/service/api/loadaddress';
import type { Address } from '@/types/type';
import { createOrder } from '@/service/api/createorder';
import { checkStock, type InsufficientStockItem } from '@/service/checkStock';
import { useToast } from '@/components/Toast';
import { 
  CreditCard, 
  MapPin, 
  Phone, 
  AlertCircle, 
  Package, 
  Store, 
  ArrowRight,
  XCircle,
  Loader2,
  ShoppingCart
} from 'lucide-react';

export default function CheckoutPage() {
  const [summary, setSummary] = useState<{ cart_id: number; items: CheckoutItem[]; totalAmount: number } | null>(null);
  const [selectedAddressData, setSelectedAddressData] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);
  const [insufficientStockItems, setInsufficientStockItems] = useState<InsufficientStockItem[]>([]);
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const addressId = searchParams.get('addressId');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('กรุณาเข้าสู่ระบบ', 'warning');
        router.push('/');
        return;
      }

      if (!addressId) {
        showToast('กรุณาเลือกที่อยู่จัดส่ง', 'warning');
        router.push('/cart');
        return;
      }

      try {
        const data = await getCartSummary(token);
        console.log("Cart summary data:", data);
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
        // เช็คสต็อกจาก Backend
        await checkStockAvailability(token, data);
        const addrData = await loadaddress(token);
        const selectedAddr = addrData.find(addr => addr.address_id === Number(addressId));
        if (selectedAddr) {
          setSelectedAddressData(selectedAddr);
        } else {
          showToast('ไม่พบที่อยู่ที่เลือก', 'error');
          router.push('/cart');
          return;
        }
      } catch (err) {
        console.error(err);
        showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, addressId, showToast]);

  // ฟังก์ชันเช็คสต็อกจาก Backend
  const checkStockAvailability = async (token: string, data: { items: CheckoutItem[] }) => {
    try {
      setCheckingStock(true);
      // เตรียมข้อมูลสำหรับเช็คสต็อก
      const stockCheckItems = data.items.map(item => ({
        productId: item.product_id,
        quantity: item.quantity,
        variantId: item.variant_id || null,
      }));
      const stockResult = await checkStock(token, stockCheckItems);
      if (!stockResult.available && stockResult.insufficientItems) {
        setInsufficientStockItems(stockResult.insufficientItems);
        console.log("⚠️ Insufficient stock items:", stockResult.insufficientItems);
      } else {
        setInsufficientStockItems([]);
        console.log("✅ All items have sufficient stock");
      }
    } catch (error) {
      console.error("❌ Error checking stock:", error);
    } finally {
      setCheckingStock(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">กำลังโหลด...</span>
      </div>
    );
  }

  if (!summary || summary.items.length === 0)
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mb-3" />
        <p className="text-gray-500">ยังไม่มีสินค้าที่จะชำระเงิน</p>
      </div>
    );

  if (!selectedAddressData)
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <MapPin className="w-16 h-16 text-gray-300 mb-3" />
        <p className="text-gray-500">ไม่พบที่อยู่จัดส่ง</p>
      </div>
    );

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const totalAmount = summary.items.reduce(
    (sum, item) => sum + Number(item.total_price),
    0
  );
  const subtotalsByShop = summary.items.reduce((acc, item) => {
    const shop = item.shop_name;
    if (!acc[shop]) acc[shop] = 0;
    acc[shop] += Number(item.total_price);
    return acc;
  }, {} as Record<string, number>);

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
        variant_id: item.variant_id || null,
        variant_option_ids: item.variant_options?.map(vo => vo.variant_option_id) || [],
        total_price: item.total_price,
      };
    }),
  };

  const handleCreateOrder = async () => {
    if (!token) {
      showToast('กรุณาเข้าสู่ระบบ', 'warning');
      router.push('/');
      return;
    }

    // เช็คสต็อกอีกครั้งก่อนสร้าง order (Real-time check)
    if (insufficientStockItems.length > 0) {
      showToast('มีสินค้าบางรายการมีจำนวนไม่เพียงพอ กรุณาตรวจสอบและแก้ไขจำนวนสินค้าในตะกร้า', 'warning');
      return;
    }

    console.log("Sending createOrderPayload:", createOrderPayload);
    try {
      setCreatingOrder(true);
      const response = await createOrder(token, createOrderPayload);
      showToast('สร้างคำสั่งซื้อสำเร็จ', 'success');
      router.push(`/payment?addressId=${addressId}&orderId=${response.order_id}`);
    } catch (error: any) {
      // ถ้า Backend ตอบกลับว่าสต็อกไม่พอ
      if (error.response?.data?.message?.includes('Stock not enough')) {
        showToast('สินค้าหมดสต็อกขณะทำการสั่งซื้อ กรุณาลองใหม่อีกครั้ง', 'error');
        // รีเฟรชข้อมูล
        window.location.reload();
      } else {
        showToast('สร้างคำสั่งซื้อไม่สำเร็จ', 'error');
      }
      console.error(error);
    } finally {
      setCreatingOrder(false);
    }
  };

  // หาสินค้าที่สต็อกไม่พอจาก Backend response
  const getInsufficientStockInfo = (productId: number, variantId?: number | null) => {
    return insufficientStockItems.find(
      item => item.product_id === productId && item.variant_id === variantId
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold">สรุปการชำระเงิน</h1>
      </div>

      {/* แสดง Loading ขณะเช็คสต็อก */}
      {checkingStock && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-blue-700">กำลังตรวจสอบสต็อกสินค้า...</span>
          </div>
        </div>
      )}

      {/* แสดงข้อความเตือนเมื่อสต็อกไม่เพียงพอ */}
      {!checkingStock && insufficientStockItems.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">สินค้าในสต็อกไม่เพียงพอ</h3>
              <p className="text-sm text-red-700 mb-3">
                กรุณาแก้ไขจำนวนสินค้าในตะกร้าก่อนทำการสั่งซื้อ
              </p>
              <ul className="space-y-2">
                {insufficientStockItems.map((item, index) => (
                  <li key={index} className="p-3 bg-white rounded border border-red-200">
                    <p className="font-semibold text-gray-800">{item.product_name}</p>
                    {item.variant_info && (
                      <p className="text-sm text-gray-600">ตัวเลือก: {item.variant_info}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-red-600 font-medium">
                        คุณต้องการ: {item.requested_quantity} ชิ้น
                      </span>
                      <span className="text-sm text-gray-500">|</span>
                      <span className="text-sm text-orange-600 font-medium">
                        มีเหลือเพียง: {item.available_stock} ชิ้น
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/cart')}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>กลับไปแก้ไขตะกร้าสินค้า</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* แสดงที่อยู่ที่เลือก */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">ที่อยู่จัดส่ง</h3>
            <p className="text-gray-700">
              {selectedAddressData.firstname} {selectedAddressData.lastname}
            </p>
            <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
              <Phone className="w-4 h-4" />
              {selectedAddressData.phone_number}
            </p>
            <p className="text-gray-700 mt-1">
              {selectedAddressData.house_number} {selectedAddressData.street} {selectedAddressData.sub_district} {selectedAddressData.district} {selectedAddressData.province} {selectedAddressData.postal_code}
            </p>
          </div>
          <button
            onClick={() => router.push('/cart')}
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            เปลี่ยน
          </button>
        </div>
      </div>

      <ul className="space-y-4">
        {summary.items.map((item) => {
          const insufficientInfo = getInsufficientStockInfo(item.product_id, item.variant_id);
          const isStockInsufficient = !!insufficientInfo;
          return (
            <li 
              key={item.cart_item_id} 
              className={`border p-4 rounded ${isStockInsufficient ? 'bg-red-50 border-red-300' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    <p className="font-semibold">{item.product_name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Store className="w-4 h-4" />
                    <span>{item.shop_name}</span>
                  </div>
                  <p className="text-sm">จำนวน: {item.quantity} × ฿{Number(item.price_per_unit).toFixed(2)}</p>
                  <p className="text-sm font-semibold">รวมรายการ: ฿{Number(item.total_price).toFixed(2)}</p>
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
                    </div>
                  )}
                </div>
                {/* แสดงไอคอนเตือนถ้าสต็อกไม่พอ */}
                {isStockInsufficient && (
                  <div className="ml-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                )}
              </div>
              {/* แสดงข้อความเตือนสำหรับสินค้าแต่ละรายการ */}
              {isStockInsufficient && insufficientInfo && (
                <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-800 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">
                    สต็อกไม่เพียงพอ! คุณต้องการ {insufficientInfo.requested_quantity} ชิ้น แต่มีเหลือเพียง {insufficientInfo.available_stock} ชิ้น
                  </p>
                </div>
              )}
            </li>
          );
        })}
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
          disabled={creatingOrder || checkingStock || insufficientStockItems.length > 0}
          className={`px-6 py-2 rounded text-white transition inline-flex items-center gap-2 ${
            creatingOrder || checkingStock || insufficientStockItems.length > 0
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {creatingOrder ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังสร้างคำสั่งซื้อ...</span>
            </>
          ) : checkingStock ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังตรวจสอบสต็อก...</span>
            </>
          ) : insufficientStockItems.length > 0 ? (
            <>
              <XCircle className="w-5 h-5" />
              <span>ไม่สามารถสั่งซื้อได้ (สต็อกไม่พอ)</span>
            </>
          ) : (
            <>
              <span>สร้างคำสั่งซื้อและไปหน้าชำระเงิน</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}