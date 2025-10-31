'use client';

import { useEffect, useState } from 'react';
import { mygroup, GroupBuying } from '@/service/api/groupsharing/customerGroup';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Store,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

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
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...Object.values(statusCount), 1);

  const statusConfig = {
    active: {
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-100',
      label: 'กำลังดำเนินการ'
    },
    pending: {
      icon: Clock,
      color: 'bg-yellow-400',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      label: 'รอเริ่ม'
    },
    completed: {
      icon: CheckCircle,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-100',
      label: 'เสร็จสิ้น'
    },
    cancelled: {
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-100',
      label: 'ยกเลิก'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">กลุ่มของฉัน</h1>
          <p className="text-gray-600">ติดตามสถานะและจัดการกลุ่มซื้อของคุณ</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(['active', 'pending', 'completed', 'cancelled'] as const).map((status) => {
            const config = statusConfig[status];
            const count = statusCount[status];
            const Icon = config.icon;

            return (
              <div
                key={status}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-6 h-6 ${config.textColor}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{count}</div>
                <div className="text-sm text-gray-600">{config.label}</div>
              </div>
            );
          })}
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">สถิติกลุ่ม</h2>
          <div className="flex gap-6">
            {(['active', 'pending', 'completed', 'cancelled'] as const).map((status) => {
              const count = statusCount[status];
              const heightPercent = (count / maxCount) * 100;
              const config = statusConfig[status];

              return (
                <div key={status} className="flex-1 text-center">
                  <div className="h-40 flex items-end justify-center bg-gray-50 rounded-lg p-2">
                    <div
                      className={`${config.color} w-12 rounded-t transition-all duration-500`}
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                  </div>
                  <div className="mt-3 text-sm font-medium text-gray-700">{config.label}</div>
                  <div className="text-gray-500 text-sm">{count} กลุ่ม</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">รายการกลุ่มทั้งหมด</h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {groups.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="flex justify-center mb-4">
                  <AlertCircle className="w-16 h-16 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">ยังไม่มีกลุ่ม</h3>
                <p className="text-gray-500">คุณยังไม่ได้เข้าร่วมกลุ่มซื้อใดๆ</p>
              </div>
            ) : (
              groups.map((g) => {
                const config = statusConfig[g.group_status as keyof typeof statusConfig] || statusConfig.active;
                const StatusIcon = config.icon;

                return (
                  <div
                    key={g.group_id}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        <span>{config.label}</span>
                      </div>
                    </div>

                    {/* Group Name */}
                    <h3 className="font-semibold text-lg text-gray-800 mb-4 line-clamp-2">
                      {g.group_name}
                    </h3>

                    {/* Details */}
                    <div className="space-y-3">
                      {/* Shop */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{g.shop_name}</span>
                      </div>

                      {/* Product */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{g.product.name}</span>
                      </div>

                      {/* Members */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>
                          สมาชิก: <span className="font-semibold text-gray-800">{g.current_members}</span>
                          <span className="text-gray-400"> / {g.required_members}</span> คน
                        </span>
                      </div>

                      {/* Expiry Date */}
                      {g.expire_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>หมดอายุ: {new Date(g.expire_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>ความคืบหน้า</span>
                        <span>{Math.round((g.current_members / g.required_members) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config.color} transition-all duration-500`}
                          style={{ width: `${Math.min((g.current_members / g.required_members) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}