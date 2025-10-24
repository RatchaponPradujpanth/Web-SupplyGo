'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // ตรวจสอบว่ามี token หรือไม่
    const token = localStorage.getItem('token');
    if (token) {
      // ถ้า login แล้ว redirect ไปหน้าหลัก
      router.push('/');
    }
  }, [router]);

  return (
    <>
      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <LoginForm onSuccess={() => window.location.assign("/role-redirect")} />
      </main>
    </>
  );
}
