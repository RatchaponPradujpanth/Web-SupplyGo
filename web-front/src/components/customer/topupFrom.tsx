// src/app/topup/TopupForm.tsx
'use client';

import React, { useState } from 'react';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createTopupPointPayment } from '@/service/api/groupsharing/topuppoint';
import NumericInput from '@/components/ui/NumericInput';

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

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TopupFormModal({ amount, onSuccess, onCancel }: PaymentFormProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 flex-shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">💳</span>
            ชำระเงิน
          </h2>
          <p className="text-sm opacity-90 mt-2">กรุณากรอกข้อมูลบัตรเครดิต/เดบิตเพื่อชำระเงิน</p>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <Elements stripe={stripePromise}>
            <TopupFormContent amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
          </Elements>
        </div>
      </div>
    </div>
  );
}

// ✅ Form Content Component
const TopupFormContent: React.FC<{
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!stripe || !elements) {
      setMessage({ type: 'error', text: 'ระบบยังไม่พร้อมสำหรับการชำระเงิน' });
      return;
    }

    if (amount <= 0) {
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

      const clientSecret = await createTopupPointPayment(token, amount);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) throw new Error(error.message);

      if (paymentIntent?.status === 'succeeded') {
        setMessage({ type: 'success', text: '✅ การชำระเงินสำเร็จ! Point จะถูกอัปเดตโดยอัตโนมัติ' });
        onSuccess();
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {message && (
        <div
          className={`p-3 rounded ${
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

      <div>
        <NumericInput
          label="จำนวน Point ที่ต้องการเติม"
          value={amount}
          onChange={() => {}}
          disabled={true}
          labelClassName="block text-sm font-semibold mb-2"
          inputClassName="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none text-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">ข้อมูลบัตร</label>
        <div className="border-2 border-gray-300 rounded-xl p-3">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? 'กำลังทำรายการ...' : '✓ ชำระเงิน'}
        </button>
      </div>
    </form>
  );
};
