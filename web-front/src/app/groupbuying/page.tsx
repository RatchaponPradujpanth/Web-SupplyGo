'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadbalance } from '@/service/api/loadbalance';
import { loadgroupbuy } from '@/service/api/groupsharing/loadgroupbuy';
import { joingroup } from '@/service/api/groupsharing/joingroup';
import { leavegroup } from '@/service/api/groupsharing/leavegroup';
import { loadaddress } from '@/service/api/loadaddress';
import type { GroupBuyingResult, Address, GroupBuyingMember } from '@/types/type';

export default function GroupBuyingPage() {
  const [points, setPoints] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupBuyingResult[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningIds, setJoiningIds] = useState<number[]>([]);
  const [leavingIds, setLeavingIds] = useState<number[]>([]);
  const [modalGroupId, setModalGroupId] = useState<number | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [nowTime, setNowTime] = useState(Date.now());
  const router = useRouter();

  // Countdown update
  useEffect(() => {
    const interval = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    if (ms <= 0) return 'หมดเวลา';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(ss)}`;
  };

  const mapGroupToResult = (group: any, userInGroups: number[]): GroupBuyingResult => {
    const member_count = group.members?.length || 0;
    const user_in_group = userInGroups.includes(group.group_buying_id);

    const product_image = group.product?.product_images?.[0]?.image_url ?? null;
    const secondary_images = group.product?.product_images?.slice(1).map((img: any) => img.image_url) ?? [];

    return {
      group_buying_id: group.group_buying_id,
      group_name: group.group_name,
      description: group.description,
      expire_at: group.expire_at,
      product_id: group.product_id,
      variant_id: group.variant_id ?? null,
      product_name: group.product?.product_name ?? null,
      product_image,
      secondary_images,
      total_items: group.total_items,
      required_members: group.required_members,
      status: group.status,
      created_at: group.created_at,
      updated_at: group.updated_at,
      points_per_group: group.points_per_group,
      points_per_member: group.points_per_member,
      items_per_member: group.items_per_member,
      member_count,
      members: group.members ?? [],
      // helper fields
      is_full: member_count >= group.required_members,
      user_in_group,
    };
  };

  const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const balanceData = await loadbalance(token); // balanceData เป็น number
setPoints(balanceData); // ✅ ตรง type number | null

    // Load group buying (user_in_group มากับ route แล้ว)
    const groupData = await loadgroupbuy(token);
    if (Array.isArray(groupData)) {
      setGroups(groupData); // ไม่ต้อง map อีกแล้ว ถ้า backend ส่งครบแล้ว
    }

    // Load addresses
    const addressData = await loadaddress(token);
    setAddresses(Array.isArray(addressData) ? addressData : []);
    if (addressData.length > 0) setSelectedAddressId(addressData[0].address_id);
  } catch (err: any) {
    console.error(err);
    setError(err.message || 'โหลดข้อมูลไม่สำเร็จ');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmJoin = async () => {
    if (!modalGroupId || !selectedAddressId) {
      alert('กรุณาเลือกที่อยู่ก่อนเข้ากลุ่ม');
      return;
    }

    if (points === null) return;

    const group = groups.find(g => g.group_buying_id === modalGroupId);
    if (!group) return;

    if (points < group.points_per_member) {
      alert('คุณมี point ไม่เพียงพอ');
      return;
    }

    // Optimistic update
    setGroups(prev =>
      prev.map(g =>
        g.group_buying_id === modalGroupId
          ? { ...g, user_in_group: true, member_count: g.member_count + 1 }
          : g
      )
    );
    setJoiningIds(prev => [...prev, modalGroupId]);

    try {
      await joingroup(modalGroupId, points, selectedAddressId);
      alert('เข้ากลุ่มสำเร็จ 🎉');
      setModalGroupId(null);
    } catch (err: any) {
      alert(err.message || 'เข้ากลุ่มไม่สำเร็จ ❌');
      // Revert optimistic update
      setGroups(prev =>
        prev.map(g =>
          g.group_buying_id === modalGroupId
            ? { ...g, user_in_group: false, member_count: g.member_count - 1 }
            : g
        )
      );
    } finally {
      setJoiningIds(prev => prev.filter(id => id !== modalGroupId));
    }
  };

  const handleLeaveGroup = async (group_buying_id: number) => {
    const confirmLeave = confirm('คุณต้องการออกจากกรุ๊ปนี้หรือไม่?');
    if (!confirmLeave) return;

    // Optimistic update
    setGroups(prev =>
      prev.map(g =>
        g.group_buying_id === group_buying_id
          ? { ...g, user_in_group: false, member_count: Math.max(g.member_count - 1, 0) }
          : g
      )
    );
    setLeavingIds(prev => [...prev, group_buying_id]);

    try {
      await leavegroup(group_buying_id);
      alert('ออกจากกลุ่มสำเร็จ ✅');
    } catch (err: any) {
      alert(err.message || 'ออกจากกลุ่มไม่สำเร็จ ❌');
      // Revert optimistic update
      setGroups(prev =>
        prev.map(g =>
          g.group_buying_id === group_buying_id
            ? { ...g, user_in_group: true, member_count: g.member_count + 1 }
            : g
        )
      );
    } finally {
      setLeavingIds(prev => prev.filter(id => id !== group_buying_id));
    }
  };

  if (loading) return <div className="p-6 text-gray-600">กำลังโหลด...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen p-6 bg-bgpage text-textmain font-inter">
      <h1 className="text-2xl font-semibold mb-6">🎯 Group Buying</h1>

      {/* Balance */}
      <div className="bg-white rounded-card shadow-card p-6 w-full max-w-md text-center mb-8">
        <h2 className="text-lg font-semibold mb-2">ยอด point ของคุณ</h2>
        {points != null && <p className="text-2xl font-bold text-accent">{points} point</p>}
      </div>

      {/* Groups */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(group => {
          const isJoining = joiningIds.includes(group.group_buying_id);
          const isLeaving = leavingIds.includes(group.group_buying_id);

          // Countdown
          const expireTimestamp = group.expire_at ? new Date(group.expire_at).getTime() : Date.now();
          const createdTimestamp = group.created_at ? new Date(group.created_at).getTime() : Date.now();
          const totalDuration = expireTimestamp - createdTimestamp;
          const remaining = Math.max(expireTimestamp - nowTime, 0);
          const percent = Math.min(100, Math.round((remaining / totalDuration) * 100));
          const progressColor = percent <= 20 ? 'bg-red-500' : 'bg-primary';

          return (
            <div key={group.group_buying_id} className="bg-white rounded-card shadow-card p-4 flex flex-col">
              {group.product_image && (
                <div className="flex gap-2 overflow-x-auto mb-2">
                  <img src={group.product_image} alt="Main product" className="w-24 h-24 object-cover rounded flex-shrink-0" />
                  {group.secondary_images?.map((img, idx) => (
                    <img key={idx} src={img} alt={`Secondary ${idx + 1}`} className="w-24 h-24 object-cover rounded flex-shrink-0" />
                  ))}
                </div>
              )}

              <p><strong>Group Name:</strong> {group.group_name ?? '-'}</p>
              <p><strong>Description:</strong> {group.description ?? '-'}</p>
              <p><strong>Expire At:</strong> {group.expire_at ? new Date(group.expire_at).toLocaleString() : '-'}</p>
              <p><strong>Required Members:</strong> {group.required_members}</p>
              <p><strong>Current Members:</strong> {group.member_count}</p>

              {/* Countdown bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-2 ${progressColor}`} style={{ width: `${percent}%` }}></div>
                </div>
                <div className="mt-1 text-sm text-textmuted flex justify-between">
                  <span>เข้าร่วมแล้ว {group.member_count} / {group.required_members} คน</span>
                  <span>{formatDuration(remaining)}</span>
                </div>
              </div>

              {/* Special display if user in group */}
              {group.user_in_group && (
                <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">
                  คุณอยู่ในกลุ่มนี้แล้ว 🎉
                  <div className="text-sm mt-1">
                    {group.member_count} / {group.required_members} คนเข้าร่วมแล้ว
                  </div>
                  <div className="text-sm mt-1">
                    เวลาที่เหลือ: {formatDuration(remaining)}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setModalGroupId(group.group_buying_id)}
                  disabled={isJoining || group.status !== 'open' || group.is_full || group.user_in_group}
                  className={`flex-1 py-2 rounded text-white transition ${
                    isJoining || group.status !== 'open' || group.is_full || group.user_in_group
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isJoining
                    ? 'กำลังเข้ากลุ่ม...'
                    : group.is_full
                    ? 'เต็มแล้ว'
                    : group.user_in_group
                    ? 'คุณอยู่ในกลุ่มแล้ว'
                    : 'Join Group'}
                </button>

                <button
                  onClick={() => handleLeaveGroup(group.group_buying_id)}
                  disabled={isLeaving || !group.user_in_group}
                  className={`flex-1 py-2 rounded text-white transition ${
                    isLeaving || !group.user_in_group
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isLeaving ? 'กำลังออก...' : 'Leave Group'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal เลือกที่อยู่ */}
      {modalGroupId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-textmain p-6 rounded shadow max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">เลือกที่อยู่จัดส่ง</h2>
            <select
              className="w-full border rounded-input p-2 mb-4"
              value={selectedAddressId ?? ''}
              onChange={e => setSelectedAddressId(Number(e.target.value))}
            >
              {addresses.map(addr => (
                <option key={addr.address_id} value={addr.address_id}>
                  {addr.firstname} {addr.lastname} - {addr.phone_number} | {addr.house_number} {addr.street} {addr.sub_district} {addr.district} {addr.province} {addr.postal_code}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalGroupId(null)}
                className="px-4 py-2 rounded-pill bg-gray-400 hover:bg-gray-500 text-white"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmJoin}
                className="px-4 py-2 rounded-pill bg-secondary hover:bg-secondary/80 text-white"
              >
                ยืนยันเข้ากลุ่ม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
