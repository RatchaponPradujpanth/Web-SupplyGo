'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { confirmStripeConnect } from '@/service/api/stripe/connectstripe';

export default function ConnectCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const acct_id = searchParams.get('acct_id');
  const shop_id = searchParams.get('shop_id');

  const [message, setMessage] = useState('⏳ กำลังเชื่อมบัญชี Stripe...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
  const confirmConnect = async () => {
    if (!acct_id || !shop_id) {
      setMessage('❌ ข้อมูลไม่ครบ');
      setStatus('error');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setMessage('❌ ไม่พบ token กรุณาล็อกอินใหม่');
        setStatus('error');
        return;
      }

      // ✅ ส่งทั้ง acct_id และ token
      const text = await confirmStripeConnect(acct_id, token);
      setMessage(`✅ ${text}`);
      setStatus('success');

      // ⏱ รอ 2 วินาทีแล้ว redirect อัตโนมัติ
      setTimeout(() => {
        router.push('/store/dashboard');
      }, 2000);

    } catch (error) {
      console.error('❌ Error confirming Stripe connect:', error);
      setMessage('❌ เกิดข้อผิดพลาดในการเชื่อมบัญชี Stripe');
      setStatus('error');
    }
  };

  confirmConnect();
}, [acct_id, shop_id, router]);


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          เชื่อมบัญชี Stripe
        </h1>
        <p
          className={`text-base mb-6 ${
            status === 'success'
              ? 'text-green-600'
              : status === 'error'
              ? 'text-red-600'
              : 'text-gray-600'
          }`}
        >
          {message}
        </p>
        {status === 'success' && <p className="text-gray-500">กำลังพาไปหน้า Dashboard...</p>}
      </div>
    </div>
  );
}
