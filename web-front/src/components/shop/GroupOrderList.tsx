"use client";
import React, { useEffect, useState } from "react";
import { managegroup } from "@/service/api/groupsharing/managegroup";
import { confirmGroupOrder } from "@/service/api/groupsharing/confirmgrouporder";
import { cancelgroup } from "@/service/api/groupsharing/cancelgroup";
import type { GroupOrderResponse } from "@/types/type";

export default function ManageGroups() {
  const [groups, setGroups] = useState<GroupOrderResponse[]>([]);
  const [storeBalance, setStoreBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleConfirmOrder = async (group_buying_id: number) => {
    try {
      await confirmGroupOrder(group_buying_id);
      alert("สร้างออเดอร์เรียบร้อย 🎉");

      const token = localStorage.getItem("token");
      if (!token) return;
      const data = await managegroup(token);
      setGroups(data.groups);
      setStoreBalance(data.store_balance);
    } catch (error) {
      console.log(error)
    }
  };

  const handleCancelOrder = async (group_buying_id: number) => {
    try {
      await cancelgroup(group_buying_id);
      alert("ยกเลิกออเดอร์เรียบร้อย ❌");

      const token = localStorage.getItem("token");
      if (!token) return;
      const data = await managegroup(token);
      setGroups(data.groups);
      setStoreBalance(data.store_balance);
    } catch (error) {
      console.log(error)
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            จัดการกลุ่มซื้อ
          </h1>
          <p className="text-gray-600">
            จัดการและติดตามคำสั่งซื้อกลุ่มของคุณ
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl text-gray-600">ยังไม่มีกลุ่มซื้อ</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g, index) => {
              const members = g.members || [];
              const activeMembers = members.filter((m: any) => !m.left_at);
              const isFull = activeMembers.length >= g.required_members;
              const leftMembers = members.filter((m: any) => m.left_at);

              const statusConfig = {
                pending: {
                  bg: "bg-yellow-100",
                  text: "text-yellow-800",
                  label: "รอดำเนินการ",
                },
                confirmed: {
                  bg: "bg-green-100",
                  text: "text-green-800",
                  label: "ยืนยันแล้ว",
                },
                cancelled: {
                  bg: "bg-red-100",
                  text: "text-red-800",
                  label: "ยกเลิกแล้ว",
                },
              }[g.status] || {
                bg: "bg-gray-100",
                text: "text-gray-800",
                label: g.status,
              };

              return (
                <div
                  key={`${g.group_buying_id}-${index}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {g.group_name || "ไม่มีชื่อกลุ่ม"}
                        </h2>
                        <p className="text-blue-100 text-sm">
                          Group #{g.group_buying_id}
                        </p>
                      </div>
                      <span
                        className={`${statusConfig.bg} ${statusConfig.text} px-4 py-1.5 rounded-full text-sm font-medium self-start`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {activeMembers.length}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          สมาชิก / {g.required_members}
                        </div>
                        {isFull && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            ✓ ครบแล้ว
                          </div>
                        )}
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {g.total_items}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          สินค้าทั้งหมด
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-xl">📦</span>
                        สินค้าในกลุ่ม
                      </h3>
                      <div>
                        <p className="font-medium text-gray-800 text-lg">
                          {g.product_name || "ไม่มีข้อมูลสินค้า"}
                        </p>
                        {g.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {g.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Active Members */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">👥</span>
                        รายชื่อสมาชิก ({activeMembers.length})
                      </h3>
                      {activeMembers.length > 0 ? (
                        <div className="space-y-3">
                          {activeMembers.map((m: any) => (
                            <div
                              key={m.id}
                              className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                                    {m.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">
                                      {m.username}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {m.email}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      เข้าร่วม:{" "}
                                      {new Date(m.joined_at).toLocaleDateString(
                                        "th-TH",
                                        {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        }
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <TrackingInput
                                  groupMemberId={m.id}
                                  trackingNumber={m.tracking_number || null}
                                  onSave={(newTracking) => {
                                    setGroups((prev) =>
                                      prev.map((group) => {
                                        if (group.group_buying_id !== g.group_buying_id)
                                          return group;
                                        return {
                                          ...group,
                                          members: group.members?.map((member) =>
                                            member.group_members_id === m.id
                                              ? { ...member, tracking_number: newTracking }
                                              : member
                                          ),
                                        };
                                      })
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <div className="text-4xl mb-2">👤</div>
                          <p>ยังไม่มีสมาชิก</p>
                        </div>
                      )}
                    </div>

                    {/* Left Members */}
                    {leftMembers.length > 0 && (
                      <details className="border border-gray-200 rounded-lg">
                        <summary className="cursor-pointer px-4 py-3 hover:bg-gray-50 transition-colors font-medium text-gray-700 flex items-center gap-2">
                          <span className="text-lg">📤</span>
                          สมาชิกที่ออกไปแล้ว ({leftMembers.length})
                        </summary>
                        <div className="px-4 pb-4 space-y-2">
                          {leftMembers.map((m: any) => (
                            <div
                              key={m.id}
                              className="flex items-center gap-3 py-2 text-sm text-gray-500"
                            >
                              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                              <span>{m.username}</span>
                              <span className="text-gray-300">•</span>
                              <span>
                                ออกเมื่อ{" "}
                                {new Date(m.left_at!).toLocaleDateString(
                                  "th-TH"
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                      {isFull ? (
                        <button
                          onClick={() => handleConfirmOrder(g.group_buying_id)}
                          disabled={
                            g.status === "confirmed" ||
                            g.status === "cancelled"
                          }
                          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                            g.status === "confirmed" ||
                            g.status === "cancelled"
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow"
                          }`}
                        >
                          {g.status === "confirmed"
                            ? "✓ สร้างออเดอร์แล้ว"
                            : "สร้างออเดอร์"}
                        </button>
                      ) : (
                        <div className="flex-1 py-3 text-center text-gray-500 bg-gray-50 rounded-lg">
                          ⏳ รอสมาชิกให้ครบ
                        </div>
                      )}

                      <button
                        onClick={() => handleCancelOrder(g.group_buying_id)}
                        disabled={
                          g.status === "confirmed" || g.status === "cancelled"
                        }
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          g.status === "confirmed" || g.status === "cancelled"
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-sm hover:shadow"
                        }`}
                      >
                        {g.status === "cancelled" ? "✗ ยกเลิกแล้ว" : "ยกเลิก"}
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        สร้างเมื่อ:{" "}
                        {new Date(g.created_at).toLocaleString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    try {
      setSaving(true);
      // ใช้ API จาก GroupOrderList
      const { updateTrackingNumber } = await import("@/service/api/shop/statusgrouporder");
      await updateTrackingNumber(groupMemberId, tracking);
      setSaved(true);
      setMessage("✅ บันทึกสำเร็จ");
      if (onSave) onSave(tracking);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`❌ ${message || "เกิดข้อผิดพลาด"}`);
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tracking);
    setMessage("📋 คัดลอกแล้ว");
    setTimeout(() => setMessage(""), 2000);
  };

  if (saved && tracking) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-700">
            <span className="text-green-600 font-medium">✓</span> เลขพัสดุ:{" "}
            <span className="font-mono font-semibold">{tracking}</span>
          </span>
          <button
            onClick={handleCopy}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-50 text-xs font-medium transition-colors"
          >
            Copy
          </button>
        </div>
        {message && (
          <span className="text-xs text-green-600 font-medium">{message}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
      <input
        type="text"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="กรอกเลขพัสดุ..."
        className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-sm hover:shadow whitespace-nowrap"
      >
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
      {message && (
        <p className="text-sm text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
}