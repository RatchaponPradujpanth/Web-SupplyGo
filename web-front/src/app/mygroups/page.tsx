'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { historygroup } from '@/service/api/groupsharing/historygroup';
import type { GroupBuying } from '@/types/GroupBuying';

export default function MyGroupsPage() {
  const [groups, setGroups] = useState<GroupBuying[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('❌ No token found');
          router.push('/login');
          return;
        }

        console.log('🔑 Token found, fetching groups...');
        const data = await historygroup(token);
        console.log('📊 All groups from API:', data);
        console.log('📊 Number of groups:', data.length);
        
        // กรองเฉพาะกลุ่มที่กำลังอยู่ปัจจุบัน (ไม่รวมที่ยกเลิกหรือสำเร็จแล้ว)
        const currentGroups = data.filter((group: GroupBuying) => {
          const isInGroup = group.user_in_group === true;
          // ✅ แก้ไข: status ของกลุ่มที่กำลังดำเนินการคือ 'open', 'active', 'pending'
          const isOngoing = group.status === 'open' || group.status === 'active' || group.status === 'pending';
          
          console.log(`🔍 Group ${group.group_buying_id} "${group.group_name}":`, {
            user_in_group: group.user_in_group,
            status: group.status,
            isInGroup,
            isOngoing,
            willShow: isInGroup && isOngoing
          });
          
          return isInGroup && isOngoing;
        });
        
        console.log('✅ Filtered current groups:', currentGroups);
        console.log('✅ Number of filtered groups:', currentGroups.length);
        setGroups(currentGroups);
      } catch (error) {
        console.error('❌ Error fetching my groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyGroups();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎯 กลุ่มของฉัน</h1>
          <p className="text-gray-600">รายการกลุ่มซื้อที่คุณกำลังเข้าร่วมอยู่ปัจจุบัน</p>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">ยังไม่มีกลุ่มในหมวดนี้</h3>
            <p className="text-gray-500 mb-6">เข้าร่วมกลุ่มซื้อเพื่อรับส่วนลดพิเศษ</p>
            <button
              onClick={() => router.push('/groupbuying')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition"
            >
              เข้าร่วมกลุ่มซื้อ
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div 
                key={group.group_buying_id} 
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Status Badge */}
                <div className={`px-4 py-2 text-center font-semibold text-sm ${
                  group.status === 'active' ? 'bg-green-100 text-green-800' :
                  group.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                  group.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {group.status === 'active' ? '🟢 กำลังดำเนินการ' :
                   group.status === 'completed' ? '✅ สำเร็จแล้ว' : 
                   group.status === 'cancelled' ? '❌ ยกเลิกแล้ว' :
                   group.status}
                </div>

                <div className="p-6">
                  {/* Group Name */}
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {group.group_name || 'กลุ่มซื้อ'}
                  </h3>
                  
                  {/* Description */}
                  {group.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">สมาชิก</div>
                      <div className="text-xl font-bold text-blue-600">
                        {group.current_members || (group.members?.length || 0)}/{group.required_members}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Point ต่อคน</div>
                      <div className="text-xl font-bold text-purple-600">
                        {group.points_per_member || 0}
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  {group.product && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-xs text-gray-600 mb-1">สินค้า</div>
                      <div className="font-medium text-gray-800">
                        {group.product.product_name || 'ไม่ระบุ'}
                      </div>
                      {group.items_per_member && (
                        <div className="text-sm text-gray-600">
                          {group.items_per_member} ชิ้น/คน
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancellation Message */}
                  {group.cancellation_message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">⚠️</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-red-800">สาเหตุการยกเลิก:</div>
                          <div className="text-sm text-red-700 mt-1">{group.cancellation_message}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="text-xs text-gray-500">
                    เข้าร่วมเมื่อ: {group.joined_at 
                      ? new Date(group.joined_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : group.created_at
                      ? new Date(group.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'ไม่ทราบวันที่'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
