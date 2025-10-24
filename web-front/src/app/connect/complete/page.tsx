'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ConnectCompletePage() {
  const searchParams = useSearchParams();
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
        const res = await fetch(
          `${API_URL}/api/connect?acct_id=${acct_id}&shop_id=${shop_id}`
        );

        if (!res.ok) throw new Error(await res.text());

        const text = await res.text();
        setMessage(`✅ ${text}`);
        setStatus('success');
      } catch (err) {
        console.error(err);
        setMessage('❌ เกิดข้อผิดพลาดในการเชื่อมบัญชี Stripe');
        setStatus('error');
      }
    };

    confirmConnect();
  }, [acct_id, shop_id]);

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

        {status === 'success' && (
          <a
            href="/dashboard"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← กลับไปยัง Dashboard
          </a>
        )}
      </div>
    </div>
  );
}
