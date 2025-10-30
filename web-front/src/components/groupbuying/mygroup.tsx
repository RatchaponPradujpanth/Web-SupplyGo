'use client';

import { useEffect, useState } from 'react';
import { mygroup, GroupBuying } from '@/service/api/groupsharing/customerGroup';

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

        const counts: StatusCount = { active: 0, pending: 0, completed: 0, cancelled: 0 };
        data.forEach((g) => {
          switch (g.group_status) {
            case 'active':
              counts.active++;
              break;
            case 'pending':
              counts.pending++;
              break;
            case 'completed':
              counts.completed++;
              break;
            case 'cancelled':
              counts.cancelled++;
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...Object.values(statusCount), 1);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-8 text-gray-800 border-b pb-2">
        สรุปสถานะกลุ่มของฉัน
      </h1>

      {/* Bar Chart */}
      <div className="flex gap-6 mb-10">
        {(['active', 'pending', 'completed', 'cancelled'] as const).map((status) => {
          const count = statusCount[status];
          const heightPercent = (count / maxCount) * 100;

          const colors: Record<typeof status, string> = {
            active: 'bg-green-500',
            pending: 'bg-yellow-400',
            completed: 'bg-blue-500',
            cancelled: 'bg-red-500',
          };

          const labels: Record<typeof status, string> = {
            active: 'กำลังดำเนินการ',
            pending: 'รอเริ่ม',
            completed: 'เสร็จสิ้น',
            cancelled: 'ยกเลิก',
          };

          return (
            <div key={status} className="flex-1 text-center">
              <div className="h-40 flex items-end justify-center bg-gray-100 rounded-lg">
                <div
                  className={`${colors[status]} w-10 rounded-t transition-all duration-500`}
                  style={{ height: `${heightPercent}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm font-medium text-gray-700">{labels[status]}</div>
              <div className="text-gray-500 text-sm">{count} กลุ่ม</div>
            </div>
          );
        })}
      </div>

      {/* Group List */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {groups.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-10 border rounded-lg">
            ยังไม่มีกลุ่มของคุณในขณะนี้
          </div>
        ) : (
          groups.map((g) => (
            <div
              key={g.group_id}
              className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-6"
            >
              <div
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 ${
                  g.group_status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : g.group_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : g.group_status === 'completed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {g.group_status === 'active'
                  ? 'กำลังดำเนินการ'
                  : g.group_status === 'pending'
                  ? 'รอเริ่ม'
                  : g.group_status === 'completed'
                  ? 'เสร็จสิ้น'
                  : 'ยกเลิก'}
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">{g.group_name}</h3>
              <p className="text-gray-600 text-sm mb-1">ร้านค้า: {g.shop_name}</p>
              <p className="text-gray-600 text-sm mb-1">สินค้า: {g.product.name}</p>
              <p className="text-gray-600 text-sm mb-1">
                สมาชิก: {g.current_members}/{g.required_members} คน
              </p>
              {g.expire_at && (
                <p className="text-gray-500 text-xs mt-2">
                  หมดอายุ: {new Date(g.expire_at).toLocaleDateString('th-TH')}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
