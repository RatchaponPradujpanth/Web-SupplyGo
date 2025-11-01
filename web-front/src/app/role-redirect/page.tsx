'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserRole } from '@/service/api/fetchrole';

export default function RoleRedirect() {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // ป้องกันการทำงานซ้ำ
    if (hasRedirected.current) {
      console.log('⏸️ Already redirected, skipping...');
      return;
    }

    const redirect = async () => {
      console.log('🔄 Starting role redirect...');
      hasRedirected.current = true;
      
      // รอให้ localStorage พร้อม (แก้ปัญหา token ยังไม่ถูก save)
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        console.log('❌ No token, redirecting to home');
        router.push('/');
        return;
      }

      try {
        const role = await fetchUserRole(token);
        
        console.log('✅ User role:', role);
        console.log('✅ Role type:', typeof role);
        console.log('✅ Role length:', role?.length);
        console.log('✅ Role === "admin":', role === 'admin');
        
        // ตัดเว้นวรรคและแปลงเป็นตัวพิมพ์เล็กเพื่อเปรียบเทียบ
        const normalizedRole = role?.toString().trim().toLowerCase();
        console.log('✅ Normalized role:', normalizedRole);
        
        if (normalizedRole === 'store') {
          console.log('🚀 Redirecting to /store/dashboard');
          router.push('/store/dashboard');
        } else if (normalizedRole === 'customer') {
          console.log('🚀 Redirecting to /');
          router.push('/');
        } else if (normalizedRole === 'admin') {
          console.log('🚀 Redirecting to /admin');
          router.push('/admin');
        } else {
          console.warn('⚠️ Unknown role:', role);
          router.push('/unauthorized');
        }
      } catch (error) {
        console.error("❌ หน้า fetch role มีปัญหา:", error);
        localStorage.removeItem('token');
        alert('⚠️ เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาเข้าสู่ระบบอีกครั้ง');
        router.push('/login');
      }
    };

    redirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-700">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    </div>
  );
}
