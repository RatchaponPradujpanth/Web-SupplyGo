'use client';

import { useEffect, useState } from 'react';
import { mygroup, GroupBuying } from '@/service/api/groupsharing/customerGroup';
import {
  Users,
  Clock,
  XCircle,
  Package,
  Store,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface StatusCount {
  pending: number;
  shipped: number;
  cancelled: number;
}

export default function MyGroupsDashboard() {
  const [groups, setGroups] = useState<GroupBuying[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusCount, setStatusCount] = useState<StatusCount>({
    pending: 0,
    shipped: 0,
    cancelled: 0,
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const data = await mygroup(token);
        setGroups(data);

        const counts: StatusCount = { pending: 0, shipped: 0, cancelled: 0 };
        data.forEach((g) => {
          const status = g.order_status || g.group_status || 'pending';
          switch (status) {
            case 'pending':
              counts.pending++;
              break;
            case 'shipped':
              counts.shipped++;
              break;
            case 'cancelled':
              counts.cancelled++;
              break;
            default:
              counts.pending++;
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

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'bg-yellow-400',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      label: 'รอเริ่ม'
    },
    shipped: {
      icon: CheckCircle,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-100',
      label: 'จัดส่งแล้ว'
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {(['pending', 'shipped', 'cancelled'] as const).map((status) => {
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
              groups.map((g, idx) => {
                const statusKey = g.order_status || g.group_status || 'pending';
                const config = statusConfig[statusKey as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = config.icon;
                const currentMembers = g.current_members || 0;
                const requiredMembers = g.required_members || 1;

                const key = `${g.group_id}-${statusKey}-${idx}`;

                return (
                  <div
                    key={key}
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
                          สมาชิก: <span className="font-semibold text-gray-800">{currentMembers}</span>
                          <span className="text-gray-400"> / {requiredMembers}</span> คน
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
