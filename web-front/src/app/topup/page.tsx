// src/app/topup/TopupForm.tsx
'use client';

import React, { useState } from 'react';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createTopupPointPayment } from '@/service/api/groupsharing/topuppoint';
import { updateTopupStatus } from '@/service/api/groupsharing/confirmtopup';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1a202c',
      fontSize: '16px',
      fontFamily: '"Poppins", sans-serif',
      '::placeholder': { color: '#a0aec0' },
    },
    invalid: { color: '#e53e3e' },
  },
  hidePostalCode: true,
};

function TopupFormContent() {
  const stripe = useStripe();
  const elements = useElements();

  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!stripe || !elements) {
      setMessage({ type: 'error', text: 'ระบบยังไม่พร้อมสำหรับการชำระเงิน' });
      return;
    }

    if (points <= 0) {
      setMessage({ type: 'error', text: 'กรุณากรอกจำนวน point ให้ถูกต้อง' });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setMessage({ type: 'error', text: 'ไม่พบข้อมูลบัตร กรุณาลองใหม่' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('ไม่พบ token สำหรับยืนยันตัวตน');

      // 1️⃣ เรียก backend สร้าง PaymentIntent
      const clientSecret = await createTopupPointPayment(token, points);

      // 2️⃣ ยืนยันการจ่ายเงินผ่าน Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) throw new Error(error.message);

      if (paymentIntent?.status === 'succeeded') {
        // 3️⃣ เรียก API confirm-topup เพื่ออัปเดต DB ว่า user ได้ point แล้ว
        const confirmRes = await updateTopupStatus(token, paymentIntent.id);

        if (confirmRes.success) {
          setMessage({
            type: 'success',
            text: `✅ เติม point สำเร็จ! จำนวน ${confirmRes.pointsAdded ?? points} point`,
          });
          setPoints(0);
        } else {
          throw new Error(confirmRes.message || 'ไม่สามารถอัปเดตสถานะ point ได้');
        }
      } else {
        throw new Error(`การชำระเงินล้มเหลว: ${paymentIntent?.status}`);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">💰 เติม Point</h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === 'error'
              ? 'bg-red-100 text-red-700'
              : message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">จำนวน Point ที่ต้องการเติม</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md p-2"
            min={1}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">ข้อมูลบัตร</label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className={`w-full py-3 rounded-md text-white font-semibold ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'กำลังทำรายการ...' : `เติม ${points} Point`}
        </button>
      </form>
    </div>
  );
}

export default function TopupForm() {
  return (
    <Elements stripe={stripePromise}>
      <TopupFormContent />
    </Elements>
  );
}
