'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserRole } from '@/service/apis';

export default function RoleRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchUserRole(token)
      .then(role => {
        if (role === 'store') {
          router.push('/store/dashboard');
        } else if (role === 'customer') {
          router.push('/home');
        } else if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/unauthorized');
        }
      })
      .catch(() => {
        router.push('/');
      });
  }, [router]);

  return (
    <p className="text-center mt-20 text-gray-700">กำลังตรวจสอบสิทธิ์...</p>
  );
}
