"use client";
import React, { useEffect, useState } from "react";
import { GroupOrderUI } from "@/types/type";
import { getGrouporder } from "@/service/api/shop/grouporder";
import { updateTrackingNumber } from "@/service/api/shop/statusgrouporder";

export default function GroupOrderList() {
  const [groupOrders, setGroupOrders] = useState<GroupOrderUI[]>([]);
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

        const res: GroupOrderUI[] = await getGrouporder(token);
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
    <div className="space-y-6">
      {groupOrders.map((order) => {
        const group = order.group;

        return (
          <div
            key={order.group_order_id}
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
              <ul className="list-none space-y-3 mt-2">
                {group.members.map((member) => {
                  // หา member_order ที่ตรงกับ member นี้
                  const memberOrder = order.member_orders.find(
                    (mo) => mo.group_member_id === member.group_members_id
                  );

                  return (
                    <li
                      key={member.group_members_id}
                      className="border border-gray-200 rounded-md p-3 bg-gray-50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-medium">
                            {member.user?.username || "ไม่ระบุ"}
                          </span>
                          {member.user?.email && (
                            <span className="text-sm text-gray-600">
                              {" "}
                              ({member.user.email})
                            </span>
                          )}
                          <span className="text-xs text-gray-500 ml-2">
                            เข้าร่วม:{" "}
                            {new Date(member.joined_at).toLocaleString("th-TH")}
                          </span>
                        </div>

                        {/* 🟦 ฟอร์ม Tracking */}
                        <TrackingInput
                          groupMemberId={member.group_members_id}
                          trackingNumber={memberOrder?.tracking_number || null}
                          onSave={(newTracking) => {
                            // อัปเดต state หลังบันทึก
                            setGroupOrders((prev) =>
                              prev.map((o) => {
                                if (o.group_order_id !== order.group_order_id)
                                  return o;
                                return {
                                  ...o,
                                  member_orders: o.member_orders.map((mo) =>
                                    mo.group_member_id === member.group_members_id
                                      ? { ...mo, tracking_number: newTracking, status: "shipped" }
                                      : mo
                                  ),
                                };
                              })
                            );
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500">ยังไม่มีสมาชิก</p>
            )}

            {order.items && order.items.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold">📋 รายการสินค้า:</h4>
                <ul className="mt-2 space-y-2">
                  {order.items.map((item: any) => (
                    <li key={item.group_order_item_id} className="text-sm">
                      {item.product?.product_name} x {item.quantity}
                      <span className="text-gray-600">
                        {" "}
                        (฿{item.price_per_unit}/ชิ้น)
                      </span>
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

/* ✅ TrackingInput แบบ conditional + copy */
function TrackingInput({
  groupMemberId,
  trackingNumber,
  onSave,
}: {
  groupMemberId: number;
  trackingNumber: string | null;
  onSave?: (newTracking: string) => void;
}) {
  const [tracking, setTracking] = useState(trackingNumber || "");
  const [saved, setSaved] = useState(!!trackingNumber);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (!tracking.trim()) {
      setMessage("⚠️ กรุณากรอกเลขพัสดุ");
      return;
    }
    try {
      setSaving(true);
      await updateTrackingNumber(groupMemberId, tracking);
      setSaved(true);
      setMessage("✅ บันทึกเรียบร้อยแล้ว");
      if (onSave) onSave(tracking);
    } catch (err: any) {
      setMessage(`❌ ${err.message || "เกิดข้อผิดพลาด"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tracking);
    setMessage("📋 คัดลอกเลขพัสดุแล้ว");
  };

  if (saved && tracking) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          เลขพัสดุ: <span className="font-medium">{tracking}</span>
        </span>
        <button
          onClick={handleCopy}
          className="bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300 text-xs"
        >
          Copy
        </button>
        {message && <span className="text-xs text-gray-500">{message}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <input
        type="text"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="กรอกเลขพัสดุ..."
        className="border border-gray-300 rounded-md px-3 py-1.5 w-full sm:w-60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
