"use client";
import React, { useEffect, useState } from "react";
import { managegroup } from "@/service/api/groupsharing/managegroup";
import { cancelgroup } from "@/service/api/groupsharing/cancelgroup";
import { useToast } from "@/components/Toast";
import type { GroupOrderResponse } from "@/types/type";
import {
  Package,
  Users,
  User,
  LogOut,
  Check,
  X,
  ClipboardCopy,
  Edit3,
} from "lucide-react";
import { updateGroupTrackingNumber } from "@/service/api/shop/grouptrackingnumber";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-3">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">จัดการกลุ่มซื้อ</h1>
          <p className="text-gray-600 text-sm">
            จัดการและติดตามคำสั่งซื้อกลุ่มของคุณ
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-lg text-gray-600">ยังไม่มีกลุ่มซื้อ</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g, index) => {
              const members = g.members || [];
              const activeMembers = members.filter((m: any) => !m.left_at);
              const leftMembers = members.filter((m: any) => m.left_at);

              const statusConfig = {
                pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "รอดำเนินการ" },
                confirmed: { bg: "bg-green-100", text: "text-green-800", label: "ยืนยันแล้ว" },
                cancelled: { bg: "bg-red-100", text: "text-red-800", label: "ยกเลิกแล้ว" },
              }[g.status] || { bg: "bg-gray-100", text: "text-gray-800", label: g.status };

              return (
                <div
                  key={`${g.group_buying_id}-${index}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <h2 className="text-lg font-bold text-white">{g.group_name || "ไม่มีชื่อกลุ่ม"}</h2>
                        <p className="text-blue-100 text-xs">Group #{g.group_buying_id}</p>
                      </div>
                      <span className={`${statusConfig.bg} ${statusConfig.text} px-3 py-1 rounded-full text-xs font-medium self-start`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-2 text-center text-sm">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-xl font-bold text-blue-600">{activeMembers.length}</div>
                        <div>สมาชิก / {g.required_members}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2">
                        <div className="text-xl font-bold text-purple-600">{g.total_items}</div>
                        <div>สินค้าทั้งหมด</div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm">
                      <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-1">
                        <Package className="w-4 h-4 text-blue-600" /> สินค้าในกลุ่ม
                      </h3>
                      <p className="font-medium text-gray-800">{g.product_name || "ไม่มีข้อมูลสินค้า"}</p>
                      {g.description && <p className="text-xs text-gray-600 mt-1">{g.description}</p>}
                    </div>

                    {/* Active Members */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-1 text-sm">
                        <Users className="w-4 h-4 text-blue-600" /> สมาชิก ({activeMembers.length})
                      </h3>
                      {activeMembers.length > 0 ? (
                        <div className="space-y-2">
                          {activeMembers.map((m: any) => (
                            <div
                              key={m.id}
                              className="border border-gray-200 rounded-lg p-2 bg-white hover:bg-gray-50 transition-colors text-sm"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                    {m.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="text-xs">
                                    <p className="font-semibold text-gray-800">{m.username}</p>
                                    <p className="text-gray-500">{m.email}</p>
                                    <p className="text-gray-400 mt-0.5">
                                      เข้าร่วม: {new Date(m.joined_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                </div>

                                {/* Tracking Input */}
                                {g.status === "confirmed" && (
                                  <TrackingInput
                                    groupMemberId={m.id}
                                    trackingNumber={m.tracking_number || null}
                                    onSave={(newTracking) => {
                                      setGroups((prev) =>
                                        prev.map((group) =>
                                          group.group_buying_id !== g.group_buying_id
                                            ? group
                                            : {
                                                ...group,
                                                members: group.members?.map((member) =>
                                                  member.group_members_id === m.id
                                                    ? { ...member, tracking_number: newTracking }
                                                    : member
                                                ),
                                              }
                                        )
                                      );
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                          <User className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                          <p className="text-xs">ยังไม่มีสมาชิก</p>
                        </div>
                      )}
                    </div>

                    {/* Left Members */}
                    {leftMembers.length > 0 && (
                      <details className="border border-gray-200 rounded-lg text-xs">
                        <summary className="cursor-pointer px-3 py-2 hover:bg-gray-50 transition-colors font-medium text-gray-700 flex items-center gap-1">
                          <LogOut className="w-4 h-4 text-gray-500" /> สมาชิกที่ออกไปแล้ว ({leftMembers.length})
                        </summary>
                        <div className="px-3 pb-3 space-y-1">
                          {leftMembers.map((m: any) => (
                            <div key={m.id} className="flex items-center gap-2 py-1 text-gray-500">
                              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                              <span>{m.username}</span>
                              <span className="text-gray-300">•</span>
                              <span>ออกเมื่อ {new Date(m.left_at!).toLocaleDateString("th-TH")}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Cancel Button */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleCancelOrder(g.group_buying_id)}
                        disabled={g.status === "confirmed" || g.status === "cancelled"}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all text-sm ${
                          g.status === "confirmed" || g.status === "cancelled"
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-sm hover:shadow"
                        }`}
                      >
                        {g.status === "cancelled" ? <><X className="inline w-3 h-3 mr-1" /> ยกเลิกแล้ว</> : "ยกเลิก"}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
                      สร้างเมื่อ: {new Date(g.created_at).toLocaleString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
  showToast: showToastProp,
}: {
  groupMemberId: number;
  trackingNumber: string | null;
  onSave?: (newTracking: string) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const { showToast: showToastHook } = useToast();
  const showToast = showToastProp || showToastHook;

  const [tracking, setTracking] = useState(trackingNumber || "");
  const [isEditing, setIsEditing] = useState(!trackingNumber);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!tracking.trim()) {
      showToast('กรุณากรอกเลขพัสดุ', 'warning');
      return;
    }
    try {
      setSaving(true);
      await updateGroupTrackingNumber(groupMemberId, tracking);
      setIsEditing(false);
      showToast('บันทึกเลขพัสดุสำเร็จ', 'success');
      if (onSave) onSave(tracking);
    } catch (error: any) {
      const msg = error?.message || 'เกิดข้อผิดพลาด';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tracking);
    showToast('คัดลอกเลขพัสดุแล้ว', 'success');
  };

  if (!isEditing && tracking) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 text-xs">
        <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
          <span className="text-gray-700">
            <Check className="inline w-3 h-3 text-green-600 mr-1" />
            เลขพัสดุ: <span className="font-mono font-semibold">{tracking}</span>
          </span>
          <button
            onClick={handleCopy}
            className="bg-white border border-gray-300 text-gray-700 px-2 py-0.5 rounded-md hover:bg-gray-50 flex items-center gap-1"
          >
            <ClipboardCopy className="w-3 h-3" /> Copy
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white px-2 py-0.5 rounded-md hover:bg-blue-600 flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" /> แก้ไข
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 w-full sm:w-auto text-xs">
      <input
        type="text"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="กรอกเลขพัสดุ..."
        className="border border-gray-300 rounded-lg px-3 py-1 w-full sm:w-40 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
      />
      <div className="flex gap-1 mt-1 sm:mt-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-sm hover:shadow whitespace-nowrap text-xs"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}