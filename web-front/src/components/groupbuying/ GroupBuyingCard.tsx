import React from 'react';
import type { GroupBuyingResult } from '@/types/type';

interface GroupBuyingCardProps {
  group: GroupBuyingResult;
  nowTime: number;
  isJoining: boolean;
  isLeaving: boolean;
  onJoinClick: (groupId: number) => void;
  onLeaveClick: (groupId: number) => void;
}

export default function GroupBuyingCard({
  group,
  nowTime,
  isJoining,
  isLeaving,
  onJoinClick,
  onLeaveClick,
}: GroupBuyingCardProps) {
  // Countdown calculation
  const expireTimestamp = group.expire_at ? new Date(group.expire_at).getTime() : Date.now();
  const createdTimestamp = group.created_at ? new Date(group.created_at).getTime() : Date.now();
  const totalDuration = expireTimestamp - createdTimestamp;
  const remaining = Math.max(expireTimestamp - nowTime, 0);
  const timePercent = totalDuration > 0 ? Math.min(100, Math.round((remaining / totalDuration) * 100)) : 0;
  
  // Member progress
  const memberPercent = group.required_members > 0 
    ? Math.min(100, Math.round((group.member_count / group.required_members) * 100))
    : 0;
  
  const progressColor = timePercent <= 20 ? 'bg-red-500' : timePercent <= 50 ? 'bg-yellow-500' : 'bg-green-500';

  const formatDuration = (ms: number) => {
    if (ms <= 0) return 'หมดเวลา';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(ss)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Product Images - ลดความสูง */}
      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
        <img 
          src={
            group.product_image
              ? (group.product_image.startsWith('http') 
                 ? group.product_image 
                 : `${process.env.NEXT_PUBLIC_API_URL}${group.product_image}`)
              : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNzUgOTJIMTI1TTEwMCA2N1YxMTciIHN0cm9rZT0iIzk0QTNCOCIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4='
          }
          alt="Main product" 
          className="w-full h-full object-cover"
          onError={(e) => {
            const imgElement = e.target as HTMLImageElement;
            imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNzUgOTJIMTI1TTEwMCA2N1YxMTciIHN0cm9rZT0iIzk0QTNCOCIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=';
            imgElement.onerror = null;
          }}
        />
        {group.user_in_group && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
            <span>✓</span> เข้าร่วมแล้ว
          </div>
        )}
        {group.is_full && !group.user_in_group && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            เต็มแล้ว
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Group Name & Description - ลด padding และขนาดตัวอักษร */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-gray-800 mb-1 line-clamp-1">
            {group.group_name ?? '-'}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1">
            {group.description ?? 'ไม่มีคำอธิบาย'}
          </p>
        </div>

        {/* Stats Grid - ลด padding และขนาด */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-blue-600">{group.member_count}</div>
            <div className="text-[10px] text-gray-600">ปัจจุบัน</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-purple-600">{group.required_members}</div>
            <div className="text-[10px] text-gray-600">เป้าหมาย</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green-600">{group.points_per_member ?? 0}</div>
            <div className="text-[10px] text-gray-600">Point</div>
          </div>
        </div>

        {/* Progress Bar - ลดขนาด */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span className="flex items-center gap-1">
              👥 {group.member_count}/{group.required_members}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              ⏱️ {formatDuration(remaining)}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-2 ${progressColor} transition-all duration-500 shadow-sm`} 
              style={{ width: `${memberPercent}%` }}
            />
          </div>
        </div>

        {/* User Status Banner - แบบกระชับ */}
        {group.user_in_group && (
          <div className="mb-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-1 text-green-700 text-xs font-semibold">
              <span>🎉</span>
              <span>รออีก {group.required_members - group.member_count} คน</span>
            </div>
          </div>
        )}

        {/* Status Badge - ขนาดเล็ก */}
        <div className="mb-3">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            group.status === 'open'
              ? 'bg-green-100 text-green-700'
              : group.status === 'confirmed'
              ? 'bg-blue-100 text-blue-700'
              : group.status === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {group.status === 'open' && '🟢 เปิดรับ'}
            {group.status === 'confirmed' && '✅ ยืนยันแล้ว'}
            {group.status === 'cancelled' && '❌ ยกเลิก'}
          </div>
        </div>

        {/* Action Buttons - ปุ่มเล็กลง */}
        <div className="flex gap-2">
          <button
            onClick={() => onJoinClick(group.group_buying_id)}
            disabled={
              isJoining || 
              group.status !== 'open' || 
              group.is_full || 
              group.user_in_group
            }
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform ${
              isJoining || group.status !== 'open' || group.is_full || group.user_in_group
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg hover:scale-105'
            }`}
          >
            {isJoining
              ? '⏳ กำลังเข้า...'
              : group.status !== 'open'
              ? group.status === 'confirmed'
                ? '✅ ยืนยันแล้ว'
                : '❌ ยกเลิก'
              : group.is_full
              ? '🚫 เต็ม'
              : group.user_in_group
              ? '✓ เข้าร่วมแล้ว'
              : '🎯 เข้าร่วม'}
          </button>

          {group.user_in_group && group.status === 'open' && (
            <button
              onClick={() => onLeaveClick(group.group_buying_id)}
              disabled={isLeaving}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform ${
                isLeaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg hover:scale-105'
              }`}
            >
              {isLeaving ? '⏳' : '🚪 ออก'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}