'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';  // ใช้ router สำหรับ navigate
import { loadUsername } from '@/service/apis';

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const showUsername = async () => {
    try {
      const token = localStorage.getItem('token'); // ดึง token จาก storage
      if (!token) {
        console.log("No token found");
        return;
      }

      const name = await loadUsername(token);
      setUsername(name);  // ตั้งค่าชื่อผู้ใช้ที่ได้มา
    } catch (error) {
      console.log("Error loading username:", error);
    }
  };

  useEffect(() => {
    showUsername();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token'); // ลบ token
    router.push('/'); // เด้งไปหน้าหลัก
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-400 to-purple-600 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">Hello from dashboard</h1>
      {username ? (
        <p className="text-2xl bg-black bg-opacity-20 rounded-lg px-6 py-3 shadow-lg">
          ยินดีต้อนรับคุณ <span className="font-semibold">{username}</span>
        </p>
      ) : (
        <p className="text-lg italic">กำลังโหลดข้อมูล...</p>
      )}
      <button
        onClick={handleLogout}
        className="mt-8 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition"
      >
        Logout / Clear Token
      </button>
    </div>
  );
}
