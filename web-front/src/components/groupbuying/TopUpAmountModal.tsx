'use client';

import React from 'react';

type Props = {
  amount: number;
  setAmount: (n: number) => void;
  onCancel: () => void;
  onProceed: () => void;
};

export default function TopUpAmountModal({ amount, setAmount, onCancel, onProceed }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">➕</span>
            เติม Point
          </h2>
          <p className="text-sm opacity-90 mt-2">กรุณาระบุจำนวน Point ที่ต้องการเติม</p>
        </div>

        <div className="p-6">
          <label className="block text-sm font-semibold mb-2">จำนวน Point</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:outline-none text-lg"
              placeholder="เช่น 100"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">Point</span>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
            >
              ยกเลิก
            </button>
            <button
              onClick={onProceed}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                amount > 0 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={amount <= 0}
            >
              ✓ ดำเนินการต่อ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
