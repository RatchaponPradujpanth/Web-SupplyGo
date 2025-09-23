'use client';

import React, { useEffect, useState } from 'react';
import { managegroup, ManageGroupsResponse } from '@/service/api/groupsharing/managegroup';
import { confirmGroupOrder } from '@/service/api/groupsharing/confirmgrouporder';
import type { GroupBuyingResult } from "@/types/type";

export default function ManageGroupsPage() {
  const [groups, setGroups] = useState<GroupBuyingResult[]>([]);
  const [storeBalance, setStoreBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    if (!token) {
      setError('Token not found');
      setLoading(false);
      return;
    }

    const fetchGroups = async () => {
      try {
        const data: ManageGroupsResponse = await managegroup(token);
        setGroups(data.groups);
        setStoreBalance(data.store_balance);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [token]);

  const handleConfirmOrder = async (group_buying_id: number) => {
    try {
      await confirmGroupOrder(group_buying_id);  // ✅ เรียก API confirm order
      alert('สร้างออเดอร์เรียบร้อย 🎉');

      const data: ManageGroupsResponse = await managegroup(token); // reload
      setGroups(data.groups);
    } catch (err: any) {
      alert(err.message || 'สร้างออเดอร์ไม่สำเร็จ ❌');
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Manage Group Buyings</h1>
      <p className="mb-6 text-lg">Wallet Balance: <span className="font-semibold">{storeBalance} points</span></p>

      {groups.length === 0 ? (
        <p className="text-gray-500">No group buyings found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const isFull = group.member_count >= group.required_members;

            return (
              <div key={group.group_buying_id} className="border rounded-lg p-4 shadow hover:shadow-lg transition flex flex-col">
                <img
                  src={group.product_image || '/placeholder.png'}
                  alt={group.product_name || 'Product'}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />

                <h2 className="font-semibold text-lg">{group.group_name || group.product_name}</h2>
                {group.description && <p className="text-sm text-gray-600 mb-1">{group.description}</p>}
                {group.expire_at && <p className="text-xs text-gray-500 mb-1">Expire: {new Date(group.expire_at).toLocaleString()}</p>}

                <p className="text-sm text-gray-600">Total Items: {group.total_items}</p>
                <p className="text-sm text-gray-600">Required Members: {group.required_members}</p>
                <p className="text-sm text-gray-600">Current Members: {group.member_count}</p>
                <p className="text-sm text-gray-600">Status: {group.status}</p>

                {group.members.length > 0 && (
                  <div className="mt-2">
                    <h3 className="text-sm font-semibold">Members:</h3>
                    <ul className="text-xs text-gray-700 list-disc list-inside max-h-24 overflow-y-auto">
                      {group.members.map((m) => (
                        <li key={m.id}>
                          {m.username} ({m.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4">
                  {isFull ? (
                    <button
                      onClick={() => handleConfirmOrder(group.group_buying_id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
                    >
                      สร้างออเดอร์
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">ยังไม่ครบสมาชิก</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
