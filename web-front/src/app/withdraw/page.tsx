'use client';

import React, { useState, useEffect } from 'react';
import { withdraw } from '@/service/api/groupsharing/withdraw';

export default function WithdrawPage() {
  const [points, setPoints] = useState<number>(0); // เปลี่ยนจาก amount -> points
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    console.log("🔍 Token from localStorage:", storedToken);
    setToken(storedToken);
  }, []);

  const handleWithdraw = async () => {
    if (!token) {
      setError('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (points <= 0) {
      setError('กรุณากรอกจำนวน Point ที่ถูกต้อง');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await withdraw(token, points); // ส่ง points แทน amount
      setResult(res);
    } catch (err: any) {
      console.error("Withdraw error:", err);
      setError(err?.response?.data?.message || 'ถอน Point ล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">กรุณาเข้าสู่ระบบ</h1>
          <p className="text-gray-600 mb-4">ไม่พบ token กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            ไปหน้า Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">ถอน Point ร้านค้า</h1>

        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <p>Token: {token ? `${token.substring(0, 20)}...` : 'ไม่พบ'}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จำนวน Point ที่ต้องการถอน
          </label>
          <input
            type="number"
            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-2"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            placeholder="เช่น 100"
          />
        </div>

        <button
          onClick={handleWithdraw}
          disabled={loading || points <= 0 || !token}
          className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'กำลังถอน...' : 'ถอน Point'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg">
            ✅ ถอน Point สำเร็จ <br />
            Withdrawal ID: {result.withdrawalId} <br />
            จำนวน Point: {result.points} <br />
            สถานะ: {result.status}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}
