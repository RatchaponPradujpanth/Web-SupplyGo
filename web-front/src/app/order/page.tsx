'use client'

import { useEffect, useState } from 'react'
import { getOrderHistory } from '@/service/api/orderHistory'
import { historygroup } from '@/service/api/groupsharing/historygroup'
import type { OrderHistoryResponse, GroupBuying } from '@/types/type'

type OrderType = 'normal' | 'groupbuying';
type StatusTab = 'to_ship' | 'to_receive' | 'completed' | 'cancelled';

export default function OrderHistoryPage() {
  const [orderData, setOrderData] = useState<OrderHistoryResponse | null>(null)
  const [groupData, setGroupData] = useState<GroupBuying[]>([])
  const [loading, setLoading] = useState(true)
  const [orderType, setOrderType] = useState<OrderType>('normal')
  const [statusTab, setStatusTab] = useState<StatusTab>('to_ship')

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

  // Filter orders by status
  const filterOrdersByStatus = () => {
    if (orderType === 'groupbuying') return [];
    if (!orderData?.orders) return [];
    
    return orderData.orders.filter(order => {
      const orderShops = order.order_shops || [];
      return orderShops.some(shop => {
        if (statusTab === 'to_ship') {
          return shop.status === 'pending' || shop.status === 'processing';
        } else if (statusTab === 'to_receive') {
          return shop.status === 'shipped' || shop.status === 'in_transit';
        } else if (statusTab === 'completed') {
          return shop.status === 'delivered' || shop.status === 'completed';
        }
        return false;
      });
    });
  };

  // Filter group buying by status
  const filterGroupsByStatus = () => {
    if (orderType === 'normal') return [];
    if (!groupData) return [];

    return groupData.filter(group => {
      if (statusTab === 'to_ship') {
        return group.status === 'pending' || group.status === 'active';
      } else if (statusTab === 'to_receive') {
        return group.status === 'processing' || group.status === 'shipped';
      } else if (statusTab === 'completed') {
        return group.status === 'completed' || group.status === 'delivered';
      } else if (statusTab === 'cancelled') {
        return group.status === 'cancelled' || group.status === 'expired';
      }
      return false;
    });
  };

  const filteredOrders = filterOrdersByStatus();
  const filteredGroups = filterGroupsByStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6">คำสั่งซื้อของฉัน</h1>

        {/* Order Type Tabs (Level 1) */}
        <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
          <div className="flex border-b-2">
            <button
              onClick={() => setOrderType('normal')}
              className={`flex-1 px-8 py-4 text-center font-semibold transition-all ${
                orderType === 'normal'
                  ? 'text-blue-600 bg-blue-50 border-b-4 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl mr-2">�</span>
              การสั่งซื้อปกติ
            </button>
            
            <button
              onClick={() => setOrderType('groupbuying')}
              className={`flex-1 px-8 py-4 text-center font-semibold transition-all ${
                orderType === 'groupbuying'
                  ? 'text-purple-600 bg-purple-50 border-b-4 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl mr-2">🎯</span>
              Group Buying
            </button>
          </div>
        </div>

        {/* Status Tabs (Level 2) */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setStatusTab('to_ship')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                statusTab === 'to_ship'
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">�</span>
              <div className="mt-1">ที่ต้องจัดส่ง</div>
              {statusTab === 'to_ship' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600"></div>
              )}
            </button>
            
            <button
              onClick={() => setStatusTab('to_receive')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                statusTab === 'to_receive'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🚚</span>
              <div className="mt-1">ที่ต้องได้รับ</div>
              {statusTab === 'to_receive' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
              )}
            </button>
            
            <button
              onClick={() => setStatusTab('completed')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                statusTab === 'completed'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">✅</span>
              <div className="mt-1">สำเร็จ</div>
              {statusTab === 'completed' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600"></div>
              )}
            </button>

            {orderType === 'groupbuying' && (
              <button
                onClick={() => setStatusTab('cancelled')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                  statusTab === 'cancelled'
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">❌</span>
                <div className="mt-1">ยกเลิก</div>
                {statusTab === 'cancelled' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orderType === 'groupbuying' ? (
            // Group Buying Section
            filteredGroups.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {statusTab === 'to_ship' && 'ยังไม่มีกลุ่มซื้อที่รอจัดส่ง'}
                  {statusTab === 'to_receive' && 'ยังไม่มีกลุ่มซื้อที่กำลังจัดส่ง'}
                  {statusTab === 'completed' && 'ยังไม่มีกลุ่มซื้อที่สำเร็จ'}
                  {statusTab === 'cancelled' && 'ยังไม่มีกลุ่มซื้อที่ยกเลิก'}
                </h3>
                <p className="text-gray-500">ไม่พบรายการในหมวดนี้</p>
              </div>
            ) : (
              filteredGroups.map((group, idx) => (
                <div key={`group-${group.group_buying_id}-${idx}`} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{group.group_name || 'กลุ่มซื้อ'}</h3>
                      <p className="text-sm text-gray-500">เริ่มเมื่อ: {new Date(group.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      group.status === 'active' ? 'bg-green-100 text-green-800' :
                      group.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      group.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      group.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {group.status === 'active' ? '🟢 เปิดรับ' :
                       group.status === 'completed' ? '✅ สำเร็จ' : 
                       group.status === 'cancelled' ? '❌ ยกเลิก' :
                       group.status === 'expired' ? '⏰ หมดอายุ' :
                       group.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">พอยท์ต่อคน</p>
                      <p className="text-2xl font-bold text-purple-600">{group.points_per_member} พอยท์</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">สมาชิกในกลุ่ม</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {group.current_members || (group.members?.length || 0)}/{group.required_members} คน
                      </p>
                    </div>
                  </div>

                  {group.description && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700">{group.description}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>สินค้า:</span>
                      <span className="font-medium text-gray-700">
                        {group.product?.product_name || 'ไม่ระบุ'} (x{group.items_per_member} ชิ้น/คน)
                      </span>
                    </div>
                    {group.expire_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>สิ้นสุด:</span>
                        <span className="font-medium text-gray-700">
                          {new Date(group.expire_at).toLocaleDateString('th-TH', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">ยังไม่มีการสั่งซื้อ</h3>
              <p className="text-gray-500">
                {statusTab === 'to_ship' && 'ไม่มีคำสั่งซื้อที่รอจัดส่ง'}
                {statusTab === 'to_receive' && 'ไม่มีคำสั่งซื้อที่กำลังจัดส่ง'}
                {statusTab === 'completed' && 'ไม่มีคำสั่งซื้อที่สำเร็จแล้ว'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order, orderIdx) => {
              const orderShops = order.order_shops || [];
              const address = order.address;

              return (
                <div key={`order-${order.order_id}-${orderIdx}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">คำสั่งซื้อ</span>
                        <span className="font-semibold text-gray-800">#{order.order_id}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusTab === 'to_ship' ? 'bg-orange-100 text-orange-700' :
                        statusTab === 'to_receive' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {statusTab === 'to_ship' && '📦 รอจัดส่ง'}
                        {statusTab === 'to_receive' && '🚚 กำลังจัดส่ง'}
                        {statusTab === 'completed' && '✅ สำเร็จแล้ว'}
                      </div>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-6">
                    {/* Address */}
                    {address && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-700 mb-2">📍 ที่อยู่จัดส่ง</div>
                        <div className="text-sm text-gray-600">
                          {address.firstname} {address.lastname}<br />
                          {address.house_number} {address.street} {address.sub_district}<br />
                          {address.district} {address.province} {address.postal_code}<br />
                          📞 {address.phone_number}
                        </div>
                      </div>
                    )}

                    {/* Shops */}
                    {orderShops.map((shop, shopIdx) => {
                      const items = shop.order_items || [];

                      return (
                        <div key={`order-${order.order_id}-shop-${shop.order_shop_id}-${shopIdx}`} className="mb-6 last:mb-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🏪</span>
                              <span className="font-medium text-gray-800">
                                {shop.shops?.shop_name || `ร้านค้า #${shop.shop_id}`}
                              </span>
                            </div>
                            {shop.tracking_number && (
                              <span className="text-xs text-gray-500">
                                Tracking: {shop.tracking_number}
                              </span>
                            )}
                          </div>

                          {/* Items */}
                          <div className="space-y-3">
                            {items.map((item, itemIdx) => (
                              <div key={`order-${order.order_id}-shop-${shop.order_shop_id}-item-${item.product_id}-${itemIdx}`} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800">{item.products?.product_name ?? 'ไม่พบชื่อสินค้า'}</div>
                                  {item.variant_option && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {item.variant_option.option.name}: {item.variant_option.value}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-600 mt-1">
                                    จำนวน: {item.quantity} ชิ้น
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">฿{item.price_per_unit}</div>
                                  <div className="font-semibold text-gray-800 mt-1">฿{item.total_price}</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Subtotal */}
                          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-sm text-gray-600">รวมค่าสินค้า</span>
                            <span className="text-lg font-bold text-green-600">฿{shop.subtotal}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
