'use client';

import { useEffect, useState } from 'react';
import { mygroup , GroupBuying } from '@/service/api/groupsharing/customerGroup';

interface StatusCount {
  active: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export default function MyGroupsDashboard() {
  const [groups, setGroups] = useState<GroupBuying[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusCount, setStatusCount] = useState<StatusCount>({
    active: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const data = await mygroup(token);
        setGroups(data);

        // นับจำนวนกลุ่มตาม status
        const counts: StatusCount = { active: 0, pending: 0, completed: 0, cancelled: 0 };
        data.forEach((g) => {
          switch (g.group_status) {
            case 'active':
              counts.active += 1;
              break;
            case 'pending':
              counts.pending += 1;
              break;
            case 'completed':
              counts.completed += 1;
              break;
            case 'cancelled':
              counts.cancelled += 1;
              break;
          }
        });
        setStatusCount(counts);
      } catch (err) {
        console.error('Failed to fetch groups', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...Object.values(statusCount), 1); // เพื่อ scale bar

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">📊 สถานะกลุ่มของฉัน</h1>

      {/* Bar chart */}
      <div className="flex gap-4 mb-8">
        {(['active', 'pending', 'completed', 'cancelled'] as const).map((status) => {
          const count = statusCount[status];
          const heightPercent = (count / maxCount) * 100;

          const colors: Record<typeof status, string> = {
            active: 'bg-green-500',
            pending: 'bg-yellow-400',
            completed: 'bg-purple-500',
            cancelled: 'bg-red-500',
          };

          return (
            <div key={status} className="flex-1 text-center">
              <div className="h-40 flex items-end justify-center bg-gray-100 rounded-lg">
                <div
                  className={`${colors[status]} w-12 rounded-t`}
                  style={{ height: `${heightPercent}%` }}
                ></div>
              </div>
              <div className="mt-2 font-medium text-gray-700">{status.toUpperCase()}</div>
              <div className="text-gray-500">{count} กลุ่ม</div>
            </div>
          );
        })}
      </div>

      {/* List groups */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.group_id} className="bg-white rounded-2xl shadow-lg p-6">
            <div className={`px-3 py-1 text-sm font-semibold rounded-full mb-2 ${
              g.group_status === 'active' ? 'bg-green-100 text-green-800' :
              g.group_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              g.group_status === 'completed' ? 'bg-purple-100 text-purple-800' :
              'bg-red-100 text-red-800'
            }`}>
              {g.group_status.toUpperCase()}
            </div>
            <h3 className="font-bold text-lg mb-1">{g.group_name}</h3>
            <p className="text-gray-600 mb-2">ร้าน: {g.shop_name}</p>
            <p className="text-gray-600 mb-2">สินค้า: {g.product.name}</p>
            <p className="text-gray-600 mb-2">
              สมาชิก: {g.current_members}/{g.required_members} คน
            </p>
            {g.expire_at && (
              <p className="text-gray-500 text-sm">
                หมดอายุ: {new Date(g.expire_at).toLocaleDateString('th-TH')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
