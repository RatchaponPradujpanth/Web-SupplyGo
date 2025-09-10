'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadbalance } from '@/service/api/loadbalance';
import { loadgroupbuy } from '@/service/api/loadgroupbuy';
import type { GroupBuying } from '@/types/type';

export default function GroupBuyingPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupBuying[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log("Fetched group buying:", groupData); // เช็คข้อมูล
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

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-purple-400 to-pink-500 p-6 text-white">
      <h1 className="text-4xl font-bold mb-6">🎯 Group Buying</h1>

      {/* Balance */}
      <div className="bg-white bg-opacity-90 text-black p-6 rounded-lg shadow-lg w-full max-w-md text-center mb-8">
        <h2 className="text-2xl font-semibold mb-4">ยอดเงินของคุณ</h2>
        {loading && <p>กำลังโหลดยอดเงิน...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {balance != null && !loading && !error && (
          <p className="text-3xl font-semibold text-green-600">
            {formatNumber(balance)} บาท
          </p>
        )}
      </div>

      {/* Group Buying List */}
      <div className="w-full max-w-6xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">รายการ Group Buying</h2>

        {!loading && !error && groups.length === 0 && (
          <p className="text-gray-800 text-center">ยังไม่มีรายการ Group Buying</p>
        )}

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const productImage = group.product?.product_images?.[0]?.image_url;

            return (
              <div
                key={group.id}
                className="bg-white bg-opacity-80 text-black rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer"
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
