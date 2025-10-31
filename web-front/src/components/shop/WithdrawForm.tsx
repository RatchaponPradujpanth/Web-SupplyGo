"use client";

import React, { useState, useEffect } from "react";
import { withdraw } from "@/service/api/groupsharing/withdraw";
import NumericInput from "@/components/ui/NumericInput";

export default function WithdrawPage() {
  const [points, setPoints] = useState<number | string>(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    setToken(storedToken);
  }, []);

  const handleWithdraw = async () => {
    if (!token) {
      setError("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    const pointsNum = Number(points);
    if (pointsNum <= 0 || isNaN(pointsNum)) {
      setError("กรุณากรอกจำนวน Point ที่ถูกต้อง");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await withdraw(token, pointsNum);
      setSuccess(true);
    } catch (error) {
      console.error("Withdraw error:", error);
      setError("ถอน Point ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 p-6 h-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">กรุณาเข้าสู่ระบบ</h1>
          <p className="text-gray-600 mb-4">ไม่พบ token กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            ไปหน้า Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 p-6 h-full">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">ถอน Point ร้านค้า</h1>

        <div className="mb-4">
          <NumericInput
            label="จำนวน Point ที่ต้องการถอน"
            placeholder="เช่น 100"
            min={0}
            value={points}
            onChange={(val) => setPoints(val)}
            labelClassName="block text-sm font-medium text-gray-700 mb-2"
            inputClassName="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-2"
          />
        </div>

        <button
          onClick={handleWithdraw}
          disabled={loading || Number(points) <= 0}
          className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "กำลังถอน..." : "ถอน Point"}
        </button>

        {success && (
          <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
            ✅ สร้างคำร้องถอน Point สำเร็จ
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}
