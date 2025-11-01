"use client";
import React, { useEffect, useState } from "react";
import { managegroup } from "@/service/api/groupsharing/managegroup";
import { confirmGroupOrder } from "@/service/api/groupsharing/confirmgrouporder";
import { cancelgroup } from "@/service/api/groupsharing/cancelgroup";
import { useToast } from "@/components/Toast";
import type { GroupOrderResponse } from "@/types/type";
import { Users, Loader2, LogOut } from "lucide-react";

export default function ManageGroups() {
  const [groups, setGroups] = useState<GroupOrderResponse[]>([]);
  const [storeBalance, setStoreBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const data = await managegroup(token);
        console.log("จัดการกลุ่ม", JSON.stringify(data, null, 2));
        setGroups(data.groups);
        setStoreBalance(data.store_balance);
      } catch (error: any) {
        console.error("Error fetching groups:", error.message || error);
        showToast('โหลดกลุ่มไม่สำเร็จ', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [showToast]);

  const handleConfirmOrder = async (group_buying_id: number) => {
    try {
      await confirmGroupOrder(group_buying_id);
      showToast('สร้างออเดอร์เรียบร้อย', 'success');

      const token = localStorage.getItem("token");
      if (!token) return;
      const data = await managegroup(token);
      setGroups(data.groups);
      setStoreBalance(data.store_balance);
    } catch (error: any) {
      console.log(error);
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างออเดอร์';
      showToast(msg, 'error');
    }
  };

  const handleCancelOrder = async (group_buying_id: number) => {
    try {
      await cancelgroup(group_buying_id);
      showToast('ยกเลิกออเดอร์เรียบร้อย', 'success');

      const token = localStorage.getItem("token");
      if (!token) return;
      const data = await managegroup(token);
      setGroups(data.groups);
      setStoreBalance(data.store_balance);
    } catch (error: any) {
      console.log(error);
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยกเลิกออเดอร์';
      showToast(msg, 'error');
    }
  };

  if (loading)
    return (
      <p className="text-center py-8 flex items-center justify-center gap-2 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        กำลังโหลด...
      </p>
    );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-blue-700 text-center flex items-center justify-center gap-2">
        <Users className="w-6 h-6 text-blue-600" />
        จัดการ Group Orders
      </h2>

      {groups.length === 0 ? (
        <p className="text-gray-500 text-center">ยังไม่มีกลุ่ม</p>
      ) : (
        groups.map((g, index) => {
          const members = g.members || [];
          const activeMembers = members.filter((m: any) => !m.left_at);
          const isFull = activeMembers.length >= g.required_members;

          return (
            <div
              key={`${g.group_buying_id}-${index}`}
              className="border rounded-lg shadow-md p-4 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {g.group_name || "ไม่มีชื่อกลุ่ม"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {g.product_name || "ไม่มีข้อมูลสินค้า"}
                  </p>
                  <p className="text-sm font-medium text-blue-600">฿{g.price}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">สมาชิก:</span>{" "}
                    {activeMembers.length}/{g.required_members}
                    {isFull && (
                      <span className="ml-2 text-green-600">✓ ครบแล้ว</span>
                    )}
                  </p>
                  <p className="text-xs mt-1">
                    <span className="text-gray-500">สถานะ Order:</span>{" "}
                    <span
                      className={`font-medium ${
                        g.status === "pending"
                          ? "text-yellow-600"
                          : g.status === "confirmed"
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {g.status === "pending"
                        ? "รอดำเนินการ"
                        : g.status === "confirmed"
                        ? "ยืนยันแล้ว"
                        : g.status}
                    </span>
                  </p>
                  {g.description && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      {g.description}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">ยอดรวม</p>
                  <p className="text-lg font-bold text-blue-700">
                    ฿{parseFloat(g.total_items.toString()).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* สมาชิกในกลุ่ม */}
              {activeMembers.length > 0 ? (
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                  <p className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    สมาชิกในกลุ่ม ({activeMembers.length})
                  </p>
                  <ul className="space-y-2">
                    {activeMembers.map((m: any) => (
                      <li
                        key={m.id}
                        className="text-xs text-gray-700 flex items-center gap-2 bg-white px-3 py-2 rounded"
                      >
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
                          {m.username.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <span className="font-medium block">{m.username}</span>
                          <span className="text-gray-400 text-xs">
                            {m.email}
                          </span>
                        </div>
                        <span className="text-gray-400 text-xs">
                          {new Date(m.joined_at).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-3 italic text-center py-4 bg-gray-50 rounded">
                  ยังไม่มีสมาชิกในกลุ่ม
                </p>
              )}

              {/* สมาชิกที่ออกไปแล้ว */}
              {members.some((m: any) => m.left_at) && (
                <details className="mt-3">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors flex items-center gap-1">
                    <LogOut className="w-4 h-4 text-gray-400" />
                    สมาชิกที่ออกไปแล้ว (
                    {members.filter((m: any) => m.left_at).length})
                  </summary>
                  <ul className="mt-2 space-y-1 pl-4 bg-gray-50 p-2 rounded">
                    {members
                      .filter((m: any) => m.left_at)
                      .map((m: any) => (
                        <li
                          key={m.id}
                          className="text-xs text-gray-400 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                          <span>{m.username}</span>
                          <span className="text-gray-300">•</span>
                          <span>
                            ออกเมื่อ{" "}
                            {new Date(m.left_at!).toLocaleDateString("th-TH")}
                          </span>
                        </li>
                      ))}
                  </ul>
                </details>
              )}

              {/* ปุ่มสร้างออเดอร์ / ยกเลิก */}
              <div className="mt-4 flex gap-2">
                {isFull ? (
                  <button
                    onClick={() => handleConfirmOrder(g.group_buying_id)}
                    className={`flex-1 py-2 rounded transition ${
                      g.status === "confirmed" || g.status === "cancelled"
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                    disabled={
                      g.status === "confirmed" || g.status === "cancelled"
                    }
                  >
                    {g.status === "confirmed"
                      ? "สร้างออเดอร์แล้ว"
                      : "สร้างออเดอร์"}
                  </button>
                ) : (
                  <span className="flex-1 text-sm text-gray-500 flex items-center justify-center">
                    ยังไม่ครบสมาชิก
                  </span>
                )}

                <button
                  onClick={() => handleCancelOrder(g.group_buying_id)}
                  className={`flex-1 py-2 rounded transition ${
                    g.status === "confirmed" || g.status === "cancelled"
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                  disabled={
                    g.status === "confirmed" || g.status === "cancelled"
                  }
                >
                  ยกเลิก
                </button>
              </div>

              {/* ข้อมูลเพิ่มเติม */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                <span>
                  สร้างเมื่อ:{" "}
                  {new Date(g.created_at).toLocaleDateString("th-TH")}
                </span>
                <span>Group ID: #{g.group_buying_id}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}