'use client'

import { useEffect, useState } from 'react'
import { getOrderHistory } from '@/service/api/orderHistory'
import { historygroup } from '@/service/api/groupsharing/historygroup'
import type { OrderHistoryResponse, GroupBuying } from '@/types/type'

export default function OrderHistoryPage() {
  const [orderData, setOrderData] = useState<OrderHistoryResponse | null>(null)
  const [groupData, setGroupData] = useState<GroupBuying[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'groups'>('orders') // ✅ state สำหรับสลับแท็บ

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('❌ ไม่พบ token')
        setLoading(false)
        return
      }

      try {
        const [orders, groups] = await Promise.all([
          getOrderHistory(token),
          historygroup(token),
        ])
        setOrderData(orders)
        setGroupData(groups)
      } catch (err) {
        console.error('❌ ดึงข้อมูลไม่สำเร็จ', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-4">⏳ กำลังโหลด...</div>
  if (!orderData && groupData.length === 0) return <div className="p-4">🚫 ไม่มีข้อมูล</div>

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">ประวัติคำสั่งซื้อ & Group Buying</h1>

      {/* Nav Bar */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}`}
        >
          Order History
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 rounded ${activeTab === 'groups' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-black'}`}
        >
          Group Buying History
        </button>
      </div>

      {/* แสดง content ตามแท็บ */}
      {activeTab === 'orders' && orderData?.orders.map((order, orderIdx) => {
        const orderShops = order.order_shops || [];
        const address = order.address;

        return (
          <div key={`order-${order.order_id}-${orderIdx}`} className="border p-4 rounded-lg shadow space-y-4">
            <div className="text-lg font-semibold text-blue-700">คำสั่งซื้อ #{order.order_id}</div>

            {address ? (
              <div className="text-sm text-gray-600">
                ที่อยู่จัดส่ง: {address.firstname} {address.lastname}, {address.house_number}, {address.street}, {address.sub_district}, {address.district}, {address.province}, {address.postal_code}<br />
                โทร: {address.phone_number}
              </div>
            ) : (
              <div className="text-sm text-gray-600">ไม่พบข้อมูลที่อยู่จัดส่ง</div>
            )}

            {orderShops.map((shop, shopIdx) => {
              const items = shop.order_items || []

              return (
                <div key={`order-${order.order_id}-shop-${shop.order_shop_id}-${shopIdx}`} className="border-t pt-4 mt-4">
                  <div className="font-medium text-purple-700">
                    ร้านค้า: {shop.shops?.shop_name || shop.shop_id}
                  </div>
                  <div className="text-sm text-gray-500">
                    สถานะ: {shop.status} | Tracking: {shop.tracking_number || '-'}
                  </div>

                  {items.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {items.map((item, itemIdx) => (
                        <div key={`order-${order.order_id}-shop-${shop.order_shop_id}-item-${item.product_id}-${itemIdx}`} className="text-sm border-b pb-2">
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

      {activeTab === 'groups' && groupData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-purple-700 mb-4">ประวัติ Group Buying</h2>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {groupData.map((group, groupIdx) => (
              <div key={`group-${group.group_buying_id}-${groupIdx}`} className="bg-white bg-opacity-80 text-black rounded-lg p-4 shadow flex flex-col">
                <p><strong>Group:</strong> {group.group_name || 'No Name'}</p>
                <p><strong>Product ID:</strong> {group.product_id}</p>
                <p><strong>Required Members:</strong> {group.required_members}</p>
                <p><strong>Current Members:</strong> {group.current_members}</p>
                <p><strong>Status:</strong> {group.status}</p>
                <p><strong>Points per Member:</strong> {group.points_per_member}</p>

                {group.product?.product_images?.length ? (
                  <div className="flex gap-2 overflow-x-auto mt-2">
                    {group.product.product_images.map((img, imgIdx) => (
                      <img
                        key={`group-${group.group_buying_id}-img-${imgIdx}`}
                        src={img.image_url}
                        alt={`Product ${imgIdx + 1}`}
                        className="w-24 h-24 object-cover rounded flex-shrink-0"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
