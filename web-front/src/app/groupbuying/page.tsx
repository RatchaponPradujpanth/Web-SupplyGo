'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadbalance } from '@/service/api/loadbalance';
import { loadgroupbuy } from '@/service/api/groupsharing/loadgroupbuy';
import { joingroup } from '@/service/api/groupsharing/joingroup';
import type { GroupBuying } from '@/types/type';

export default function GroupBuyingPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupBuying[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningIds, setJoiningIds] = useState<number[]>([]); // เก็บ group_buying_id ที่กำลัง join

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

        // ดึงยอดเงิน
        const balanceData = await loadbalance(token);
        setBalance(balanceData?.balance ?? 0);

        // ดึงรายการ group buying
        const groupData = await loadgroupbuy();
        setGroups(Array.isArray(groupData) ? groupData : []);
      } catch (err) {
        console.error('Load error:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatNumber = (num: number) => num.toLocaleString();

  const handleJoinGroup = async (group_buying_id: number, pointsPerMember: number) => {
    if (balance === null || balance < pointsPerMember) {
      alert('คุณมี point ไม่เพียงพอ');
      return;
    }

    setJoiningIds((prev) => [...prev, group_buying_id]);
    try {
      await joingroup(group_buying_id, balance);

      alert('เข้ากลุ่มสำเร็จ 🎉');

      // อัปเดต balance หลัง join
      const balanceData = await loadbalance(localStorage.getItem('token') || '');
      setBalance(balanceData?.balance ?? 0);

      // อัปเดตกลุ่มใหม่
      const groupData = await loadgroupbuy();
      setGroups(Array.isArray(groupData) ? groupData : []);
    } catch (err: any) {
      alert(err.message || 'เข้ากลุ่มไม่สำเร็จ ❌');
    } finally {
      setJoiningIds((prev) => prev.filter((id) => id !== group_buying_id));
    }
  };

  if (loading) return <p className="text-center mt-10 text-white">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-purple-400 to-pink-500 p-6 text-white">
      <h1 className="text-4xl font-bold mb-6">🎯 Group Buying</h1>

      {/* Balance */}
      <div className="bg-white bg-opacity-90 text-black p-6 rounded-lg shadow-lg w-full max-w-md text-center mb-8">
        <h2 className="text-2xl font-semibold mb-4">ยอดเงินของคุณ</h2>
        {balance != null && <p className="text-3xl font-semibold text-green-600">{formatNumber(balance)} บาท</p>}
      </div>

      {/* Group Buying List */}
      <div className="w-full max-w-6xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">รายการ Group Buying</h2>

        {groups.length === 0 && <p className="text-gray-800 text-center">ยังไม่มีรายการ Group Buying</p>}

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const productImage = group.product?.product_images?.[0]?.image_url;
            const isJoining = joiningIds.includes(group.group_buying_id);

            return (
              <div
                key={group.group_buying_id}
                className="bg-white bg-opacity-80 text-black rounded-lg p-4 shadow hover:shadow-lg transition flex flex-col"
              >
                {productImage && (
                  <img
                    src={productImage}
                    alt={group.product?.product_name || 'Product'}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
                )}
                <p><strong>Shop ID:</strong> {group.shop_id}</p>
                <p><strong>Product ID:</strong> {group.product_id}</p>
                <p><strong>Required Members:</strong> {group.required_members}</p>
                <p><strong>Total Items:</strong> {group.total_items}</p>
                <p><strong>Status:</strong> {group.status}</p>
                <p><strong>Created at:</strong> {new Date(group.created_at).toLocaleString()}</p>

                <button
                  onClick={() => handleJoinGroup(group.group_buying_id, group.points_per_member)}
                  disabled={isJoining || group.status !== 'open'}
                  className={`mt-2 px-4 py-2 rounded-lg text-white transition ${
                    isJoining || group.status !== 'open'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isJoining ? 'กำลังเข้ากลุ่ม...' : 'Join Group'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => router.push('/')}
        className="mt-8 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
      >
        กลับไปหน้าแรก
      </button>
    </div>
  );
}
