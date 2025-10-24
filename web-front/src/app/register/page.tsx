'use client';

import { useEffect } from 'react';
import RegisterForm from '@/components/RegisterForm';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
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
    <main className="min-h-[70vh] flex items-center justify-center p-6 bg-bgpage">
      <RegisterForm onSuccess={() => router.push('/login')} />
    </main>
  );
}
