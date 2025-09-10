'use client'

import { useEffect, useState } from 'react'
import { getOrderHistory } from '@/service/api/orderHistory' 
import type { OrderHistoryResponse } from '@/types/type'; 

export default function OrderHistoryPage() {
  const [orderData, setOrderData] = useState<OrderHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrderHistory = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('❌ ไม่พบ token')
        setLoading(false)
        return
      }

      try {
        const res = await getOrderHistory(token)
        setOrderData(res)
      } catch (err) {
        console.error('❌ ดึงประวัติการสั่งซื้อไม่สำเร็จ', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderHistory()
  }, [])

  if (loading) return <div className="p-4">⏳ กำลังโหลด...</div>
  if (!orderData) return <div className="p-4">🚫 ไม่มีข้อมูล</div>

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">ประวัติคำสั่งซื้อ</h1>

      {orderData.orders.map((order) => {
        const orderShops = order.order_shops || [];
        const address = order.address;  // ใช้ address จาก order โดยตรง

        return (
          <div key={order.order_id} className="border p-4 rounded-lg shadow space-y-4">
            <div className="text-lg font-semibold text-blue-700">คำสั่งซื้อ #{order.order_id}</div>

            {/* แสดงชื่อผู้รับ + ที่อยู่ จาก order.address */}
            {address ? (
              <div className="text-sm text-gray-600">
                ที่อยู่จัดส่ง: {address.firstname} {address.lastname}, {address.house_number}, {address.street}, {address.sub_district}, {address.district}, {address.province}, {address.postal_code}<br />
                โทร: {address.phone_number}
              </div>
            ) : (
              <div className="text-sm text-gray-600">ไม่พบข้อมูลที่อยู่จัดส่ง</div>
            )}

            {orderShops.map(shop => {
              const items = shop.order_items || [];

              return (
                <div key={shop.order_shop_id} className="border-t pt-4 mt-4">
                  <div className="font-medium text-purple-700">
                    ร้านค้า: {shop.shops?.shop_name || shop.shop_id}
                  </div>
                  <div className="text-sm text-gray-500">
                    สถานะ: {shop.status} | Tracking: {shop.tracking_number || '-'}
                  </div>

                  {items.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {items.map((item, index) => (
                        <div key={`${item.product_id}-${index}`} className="text-sm border-b pb-2">
                          <div>{item.products?.product_name ?? 'ไม่พบชื่อสินค้า'}</div>

                          {item.variant_option ? (
                            <div className="text-xs italic text-gray-600">
                              {item.variant_option.option.name}: {item.variant_option.value} (SKU: {item.variant_option.variant.sku})
                            </div>
                          ) : null}

                          <div>
                            {item.quantity} ชิ้น x {item.price_per_unit} ={' '}
                            <span className="font-medium">{item.total_price} บาท</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic mt-2">ไม่มีรายการสินค้า</div>
                  )}

                  <div className="mt-2 font-semibold text-right text-green-600">
                    รวม: {shop.subtotal} บาท
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
