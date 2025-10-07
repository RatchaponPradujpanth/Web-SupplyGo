'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadUsername, fetchUserRole } from '@/service/apis';

export default function Header() {
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const userRole = await fetchUserRole(token);
        setRole(userRole);

        const name = await loadUsername(token);
        setUsername(name);
      } catch (err) {
        console.error('Error loading header user info:', err);
        // ถ้าเกิด error ให้ล้าง state ด้วย เผื่อ token หมดอายุ
        setUsername(null);
        setRole(null);
      }
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUsername(null); // 🔹 รีเซ็ต username
    setRole(null);     // 🔹 รีเซ็ต role
    router.push('/');
  };

  return (
    <header className="bg-white shadow-card sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary"></div>
          <span className="font-semibold text-lg">SupplyGo</span>
          {role && (
            <span className="ml-3 rounded-pill bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              Role: {role}
            </span>
          )}
        </a>

        <div className="hidden md:flex items-center gap-3 w-1/2">
          <input
            aria-label="Search"
            placeholder="Search products"
            className="w-full bg-bgpage rounded-input px-4 py-2 outline-none focus:ring-2 ring-primary/30"
          />

          <button
            onClick={() => router.push('/cart')}
            className="rounded-pill px-3 py-2 hover:bg-primary/10 hover:text-primary text-sm"
          >
            Cart
          </button>

          {username ? (
            <>
              <span className="text-sm font-medium">Hi, {username}</span>
              <button
                onClick={handleLogout}
                className="rounded-pill px-3 py-2 border border-gray-200 hover:border-primary/40 hover:text-primary text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="rounded-pill px-3 py-2 border border-gray-200 hover:border-primary/40 hover:text-primary text-sm"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
