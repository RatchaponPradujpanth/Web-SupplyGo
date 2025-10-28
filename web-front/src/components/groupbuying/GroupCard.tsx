import React from 'react';
import Image from 'next/image';
import type { GroupBuyingResult } from '@/types/type';

interface GroupCardProps {
  group: GroupBuyingResult;
  timeRemaining: number;
  formatDuration: (ms: number) => string;
  onJoin: () => void;
  onLeave: () => void;
  userHasJoined: boolean;
}

export default function GroupCard({
  group,
  timeRemaining,
  formatDuration,
  onJoin,
  onLeave,
  userHasJoined,
}: GroupCardProps) {
  const isExpired = timeRemaining <= 0;
  const progressPercentage = (group.member_count / group.required_members) * 100;
  const isFull = group.is_full;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        {group.product_image ? (
          <Image
            src={group.product_image}
            alt={group.product_name || 'Product'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="text-6xl">📦</span>
          </div>
        )}
        {isExpired && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white text-xl font-bold">หมดเวลา</span>
          </div>
        )}
        {isFull && !isExpired && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            เต็มแล้ว
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
          {group.product_name || 'สินค้า'}
        </h3>

        {/* Group Name */}
        <p className="text-sm text-gray-600 mb-3">
          🛍️ {group.group_name || 'กลุ่มซื้อ'}
        </p>

        {/* Points */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm text-gray-500">พอยต์/คน</p>
            <p className="text-xl font-bold text-orange-600">
              {group.points_per_member} P
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">รวมพอยต์</p>
            <p className="text-lg font-semibold text-blue-600">
              {group.points_per_group || 0} P
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">สมาชิก</span>
            <span className="font-semibold">
              {group.member_count}/{group.required_members}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">⏰ เหลือเวลา:</span>
          <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
            {formatDuration(timeRemaining)}
          </span>
        </div>

        {/* Action Button */}
        {!isExpired && (
          <div>
            {userHasJoined ? (
              <button
                onClick={onLeave}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
              >
                ออกจากกลุ่ม
              </button>
            ) : (
              <button
                onClick={onJoin}
                disabled={isFull}
                className={`w-full py-2.5 font-semibold rounded-lg transition ${
                  isFull
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {isFull ? 'เต็มแล้ว' : 'เข้าร่วมกลุ่ม'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
