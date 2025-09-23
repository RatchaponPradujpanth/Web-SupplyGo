'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadbalance } from '@/service/api/loadbalance';
import { loadgroupbuy } from '@/service/api/groupsharing/loadgroupbuy';
import { joingroup } from '@/service/api/groupsharing/joingroup';
import { leavegroup } from '@/service/api/groupsharing/leavegroup';
import { loadaddress } from '@/service/api/loadaddress';
import type { GroupBuying, Address } from '@/types/type';

export default function GroupBuyingPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupBuying[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningIds, setJoiningIds] = useState<number[]>([]);
  const [leavingIds, setLeavingIds] = useState<number[]>([]);
  const [modalGroupId, setModalGroupId] = useState<number | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const balanceData = await loadbalance(token);
        setBalance(balanceData?.balance ?? 0);

        const groupData = await loadgroupbuy(token);
        setGroups(Array.isArray(groupData) ? groupData : []);

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

    fetchData();
  }, [router]);

  const refreshData = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const balanceData = await loadbalance(token);
      setBalance(balanceData?.balance ?? 0);

      const groupData = await loadgroupbuy(token);
      setGroups(Array.isArray(groupData) ? groupData : []);

      const addressData = await loadaddress(token);
      setAddresses(Array.isArray(addressData) ? addressData : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'รีเฟรชข้อมูลไม่สำเร็จ');
    }
  };

  const handleConfirmJoin = async () => {
    if (!modalGroupId || !selectedAddressId) {
      alert('กรุณาเลือกที่อยู่ก่อนเข้ากลุ่ม');
      return;
    }

    if (balance === null) return;

    const group = groups.find(g => g.group_buying_id === modalGroupId);
    if (!group) return;

    if (balance < group.points_per_member) {
      alert('คุณมี point ไม่เพียงพอ');
      return;
    }

    setJoiningIds(prev => [...prev, modalGroupId]);
    try {
      await joingroup(modalGroupId, balance, selectedAddressId);
      alert('เข้ากลุ่มสำเร็จ 🎉');
      await refreshData();
      setModalGroupId(null);
    } catch (err: any) {
      alert(err.message || 'เข้ากลุ่มไม่สำเร็จ ❌');
    } finally {
      setJoiningIds(prev => prev.filter(id => id !== modalGroupId));
    }
  };

  const handleLeaveGroup = async (group_buying_id: number) => {
    const confirmLeave = confirm('คุณต้องการออกจากกรุ๊ปนี้หรือไม่?');
    if (!confirmLeave) return;

    setLeavingIds(prev => [...prev, group_buying_id]);
    try {
      await leavegroup(group_buying_id);
      alert('ออกจากกลุ่มสำเร็จ ✅');
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'ออกจากกลุ่มไม่สำเร็จ ❌');
    } finally {
      setLeavingIds(prev => prev.filter(id => id !== group_buying_id));
    }
  };

  if (loading) return <div className="p-6 text-gray-600">กำลังโหลด...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-400 to-pink-500 text-white">
      <h1 className="text-4xl font-bold mb-6">🎯 Group Buying</h1>

      <div className="bg-white bg-opacity-90 text-black p-6 rounded-lg shadow-lg w-full max-w-md text-center mb-8">
        <h2 className="text-2xl font-semibold mb-4">ยอด point ของคุณ</h2>
        {balance != null && <p className="text-3xl font-semibold text-green-600">{balance} point</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(group => {
          const isJoining = joiningIds.includes(group.group_buying_id);
          const isLeaving = leavingIds.includes(group.group_buying_id);

          return (
            <div key={group.group_buying_id} className="bg-white bg-opacity-80 text-black rounded-lg p-4 shadow flex flex-col">
              {/* แสดงรูปสินค้าหลายรูป */}
              {group.product?.product_images?.length ? (
                <div className="flex gap-2 overflow-x-auto mb-2">
                  {group.product.product_images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.image_url}
                      alt={`Product ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded flex-shrink-0"
                    />
                  ))}
                </div>
              ) : null}

              <p><strong>Product ID:</strong> {group.product_id}</p>
              <p><strong>Required Members:</strong> {group.required_members}</p>
              <p><strong>Current Members:</strong> {group.current_members}</p>
              <p><strong>Status:</strong> {group.status}</p>
               <p><strong>Points per Member:</strong> {group.points_per_member}</p>
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
          <div className="bg-white text-black p-6 rounded shadow max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">เลือกที่อยู่จัดส่ง</h2>
            <select
              className="w-full border rounded p-2 mb-4"
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
                className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmJoin}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
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
