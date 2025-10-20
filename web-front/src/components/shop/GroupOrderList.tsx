"use client";
import React, { useEffect, useState } from "react";
import { GroupOrderUI, GroupBuyingMember } from "@/types/type";
import { getGrouporder } from "@/service/api/shop/grouporder";

export default function GroupOrderList() {
  const [groupOrders, setGroupOrders] = useState<GroupOrderUI[]>([]); // ✅ เปลี่ยนเป็น GroupOrderUI
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGroupOrders() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("❌ ไม่พบ token");
          setLoading(false);
          return;
        }

        const res: GroupOrderUI[] = await getGrouporder(token); // ✅ เปลี่ยน type
        console.log("API Response:", res);
        setGroupOrders(res);
      } catch (error) {
        console.error("Failed to fetch group orders:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGroupOrders();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (groupOrders.length === 0) return <div>ไม่มีคำสั่งซื้อกลุ่ม</div>;

  return (
    <div className="space-y-4">
      {groupOrders.map((order) => {
        const group = order.group; // ✅ เข้าถึงข้อมูลผ่าน order.group
        
        return (
          <div
            key={order.group_order_id} // ✅ ใช้ group_order_id แทน
            className="border rounded p-4 shadow-sm bg-white"
          >
            <h2 className="text-lg font-semibold">
              🎉 Order #{order.group_order_id} - {group.group_name}
            </h2>
            
            <div className="mt-2 space-y-1">
              <p>สมาชิก: {group.members?.length || 0}/{group.required_members}</p>
              <p>สินค้าทั้งหมด: {group.total_items} ชิ้น</p>
              <p>ต่อคน: {group.items_per_member} ชิ้น</p>
              <p>ยอดรวม: ฿{order.total_amount}</p>
              <p>สถานะ: {order.status}</p>
              <p>สร้างเมื่อ: {new Date(order.created_at).toLocaleString("th-TH")}</p>
            </div>

            <h3 className="mt-4 font-semibold">📦 สินค้าในกลุ่ม:</h3>
            {group.product ? (
              <div className="flex items-center space-x-4 mt-2">
                <img
                  src={group.product.image || "/placeholder.png"}
                  alt={group.product.product_name || "สินค้า"}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{group.product.product_name}</p>
                  <p className="text-sm text-gray-600">
                    ราคา: ฿{group.variant?.price || group.product.price}
                  </p>
                  {group.variant && (
                    <p className="text-sm text-gray-500">SKU: {group.variant.sku}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">ไม่ระบุสินค้า</p>
            )}

            <h4 className="mt-4 font-semibold">👥 สมาชิก:</h4>
            {group.members && group.members.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {group.members.map((member) => (
                  <li key={member.group_members_id}>
                    <span className="font-medium">{member.user?.username || "ไม่ระบุ"}</span>
                    {member.user?.email && (
                      <span className="text-sm text-gray-600"> ({member.user.email})</span>
                    )}
                    <span className="text-xs text-gray-500 ml-2">
                      เข้าร่วม: {new Date(member.joined_at).toLocaleString("th-TH")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">ยังไม่มีสมาชิก</p>
            )}

            {/* แสดงรายการสินค้า (items) ถ้ามี */}
            {order.items && order.items.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold">📋 รายการสินค้า:</h4>
                <ul className="mt-2 space-y-2">
                  {order.items.map((item: any) => (
                    <li key={item.group_order_item_id} className="text-sm">
                      {item.product?.product_name} x {item.quantity} 
                      <span className="text-gray-600"> (฿{item.price_per_unit}/ชิ้น)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}