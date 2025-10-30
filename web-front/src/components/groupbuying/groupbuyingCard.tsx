import React from 'react';
import type { GroupBuyingResult } from '@/types/type';
import { Users, Target, Coins, Clock, CheckCircle, XCircle, AlertCircle, LogOut, UserPlus } from 'lucide-react';

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
      {/* Product Images */}
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
            <CheckCircle size={14} />
            <span>เข้าร่วมแล้ว</span>
          </div>
        )}
        {group.is_full && !group.user_in_group && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
            <AlertCircle size={14} />
            <span>เต็มแล้ว</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Group Name & Description */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-gray-800 mb-1 line-clamp-1">
            {group.group_name ?? '-'}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1">
            {group.description ?? 'ไม่มีคำอธิบาย'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <Users size={16} className="text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">{group.member_count}</div>
            <div className="text-[10px] text-gray-600">ปัจจุบัน</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target size={16} className="text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-600">{group.required_members}</div>
            <div className="text-[10px] text-gray-600">เป้าหมาย</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <Coins size={16} className="text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">{group.points_per_member ?? 0}</div>
            <div className="text-[10px] text-gray-600">Point</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-gray-500" />
              <span>{group.member_count}/{group.required_members}</span>
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock size={14} className="text-gray-500" />
              <span>{formatDuration(remaining)}</span>
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-2 ${progressColor} transition-all duration-500 shadow-sm`} 
              style={{ width: `${memberPercent}%` }}
            />
          </div>
        </div>

        {/* User Status Banner */}
        {group.user_in_group && (
          <div className="mb-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-1 text-green-700 text-xs font-semibold">
              <CheckCircle size={14} />
              <span>
                {group.required_members - group.member_count <= 0 
                  ? 'ครบแล้ว' 
                  : `รออีก ${group.required_members - group.member_count} คน`}
              </span>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="mb-3">
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
            group.status === 'open'
              ? 'bg-green-100 text-green-700'
              : group.status === 'confirmed'
              ? 'bg-blue-100 text-blue-700'
              : group.status === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {group.status === 'open' && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>เปิดรับ</span>
              </>
            )}
            {group.status === 'confirmed' && (
              <>
                <CheckCircle size={12} />
                <span>ยืนยันแล้ว</span>
              </>
            )}
            {group.status === 'cancelled' && (
              <>
                <XCircle size={12} />
                <span>ยกเลิก</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onJoinClick(group.group_buying_id)}
            disabled={
              isJoining || 
              group.status !== 'open' || 
              group.is_full || 
              group.user_in_group
            }
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform flex items-center justify-center gap-2 ${
              isJoining || group.status !== 'open' || group.is_full || group.user_in_group
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg hover:scale-105'
            }`}
          >
            {isJoining ? (
              <>
                <Clock size={16} className="animate-spin" />
                <span>กำลังเข้า...</span>
              </>
            ) : group.status !== 'open' ? (
              group.status === 'confirmed' ? (
                <>
                  <CheckCircle size={16} />
                  <span>ยืนยันแล้ว</span>
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  <span>ยกเลิก</span>
                </>
              )
            ) : group.is_full ? (
              <>
                <AlertCircle size={16} />
                <span>เต็ม</span>
              </>
            ) : group.user_in_group ? (
              <>
                <CheckCircle size={16} />
                <span>เข้าร่วมแล้ว</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>เข้าร่วม</span>
              </>
            )}
          </button>

          {group.user_in_group && group.status === 'open' && remaining > 0 && (
            <button
              onClick={() => onLeaveClick(group.group_buying_id)}
              disabled={isLeaving}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform flex items-center gap-2 ${
                isLeaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg hover:scale-105'
              }`}
            >
              {isLeaving ? (
                <Clock size={16} className="animate-spin" />
              ) : (
                <>
                  <LogOut size={16} />
                  <span>ออก</span>
                </>
              )}
            </button>
          )}

          {group.user_in_group && (group.status !== 'open' || remaining <= 0) && (
            <button
              disabled
              title="ไม่สามารถออกจากกลุ่มได้ เนื่องจากกลุ่มปิดแล้วหรือหมดเวลา"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-300 text-gray-500 cursor-not-allowed flex items-center gap-2"
            >
              <LogOut size={16} />
              <span>ออก</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}