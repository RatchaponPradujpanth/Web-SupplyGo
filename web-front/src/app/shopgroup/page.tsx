'use client';

import React, { useEffect, useState } from 'react';
import { managegroup, ManageGroupsResponse } from '@/service/api/groupsharing/managegroup';
import type { GroupBuyingResult } from "@/types/type";

export default function ManageGroupsPage() {
  const [groups, setGroups] = useState<GroupBuyingResult[]>([]);
  const [storeBalance, setStoreBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect((): void => {
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
          {groups.map((group) => (
            <div key={group.group_buying_id} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
              {/* รูปหลัก */}
              <img
                src={group.product_image || '/placeholder.png'}
                alt={group.product_name || 'Product'}
                className="w-full h-48 object-cover rounded-md mb-4"
              />

              {/* ข้อมูลหลัก */}
              <h2 className="font-semibold text-lg">{group.group_name || group.product_name}</h2>
              {group.description && <p className="text-sm text-gray-600 mb-1">{group.description}</p>}
              {group.expire_at && <p className="text-xs text-gray-500 mb-1">Expire: {new Date(group.expire_at).toLocaleString()}</p>}
              {group.variant_id && <p className="text-xs text-gray-500 mb-1">Variant ID: {group.variant_id}</p>}

              <p className="text-sm text-gray-600">Total Items: {group.total_items}</p>
              <p className="text-sm text-gray-600">Required Members: {group.required_members}</p>
              <p className="text-sm text-gray-600">Status: {group.status}</p>
              <p className="text-sm text-gray-600">Points per Group: {group.points_per_group}</p>
              <p className="text-sm text-gray-600">Points per Member: {group.points_per_member}</p>
              <p className="text-sm text-gray-600">Members: {group.member_count}</p>

              {/* รายชื่อสมาชิก */}
              {group.members.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-sm font-semibold">Member List:</h3>
                  <ul className="text-xs text-gray-700 list-disc list-inside max-h-32 overflow-y-auto">
                    {group.members.map((m) => (
                      <li key={m.id}>
                        {m.username} ({m.email}) - joined at {new Date(m.joined_at).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* รูปรอง */}
              {group.secondary_images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {group.secondary_images.map((img, idx) => (
                    <img key={idx} src={img} alt={`secondary ${idx}`} className="w-16 h-16 object-cover rounded" />
                  ))}
                </div>
              )}

              {/* ปุ่มจัดการ */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 rounded">View</button>
                <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 rounded">Edit</button>
                <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
