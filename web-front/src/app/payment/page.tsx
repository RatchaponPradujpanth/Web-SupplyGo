'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { createMultiVendorPayment, ShopPaymentIntent } from '@/service/apis';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1a202c',
      fontSize: '16px',
      fontFamily: '"Poppins", sans-serif',
      '::placeholder': {
        color: '#a0aec0',
      },
      iconColor: '#4a5568',
      padding: '12px 14px',
    },
    invalid: {
      color: '#e53e3e',
      iconColor: '#e53e3e',
    },
  },
  hidePostalCode: true,
};

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [paymentList, setPaymentList] = useState<ShopPaymentIntent[]>([]);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const cartId = 1; // TODO: เปลี่ยนเป็น cartId จริงจากระบบหรือ context

  useEffect(() => {
    async function fetchMultiPayment() {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบเพื่อดำเนินการชำระเงิน' });
        return;
      }

      try {
        const res = await createMultiVendorPayment(token, cartId);
        setPaymentList(res.paymentIntents);
        setMessage(null);
      } catch (error: any) {
        console.error(error);
        setMessage({ type: 'error', text: error.message || 'ไม่สามารถสร้างการชำระเงินได้' });
      }
    }

    fetchMultiPayment();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!stripe || !elements) {
      setMessage({ type: 'error', text: 'ระบบชำระเงินยังไม่พร้อม' });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setMessage({ type: 'error', text: 'ไม่พบช่องกรอกบัตรเครดิต' });
      return;
    }

    setLoading(true);

    for (const [index, payment] of paymentList.entries()) {
      setMessage({ type: 'info', text: `💳 จ่ายร้าน ${payment.shop_id} (${index + 1}/${paymentList.length})` });

      const { error, paymentIntent } = await stripe.confirmCardPayment(payment.client_secret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        setMessage({ type: 'error', text: `❌ ร้าน ${payment.shop_id}: ${error.message}` });
        setLoading(false);
        return;
      }

      if (paymentIntent?.status !== 'succeeded') {
        setMessage({
          type: 'error',
          text: `⚠️ ร้าน ${payment.shop_id} จ่ายไม่สำเร็จ (สถานะ: ${paymentIntent?.status})`,
        });
        setLoading(false);
        return;
      }
    }

    setMessage({ type: 'success', text: '✅ ชำระเงินสำเร็จครบทุกเจ้าร้านแล้ว!' });
    setTimeout(() => router.push('/thankyou'), 1500);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">💳 ชำระเงิน</h1>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded ${
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

      {!paymentList.length && !message && (
        <p className="text-center text-gray-500 animate-pulse">⏳ กำลังเตรียมข้อมูลสำหรับชำระเงิน...</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <label className="block text-gray-700 font-semibold">
          ข้อมูลบัตรเครดิต
          <div className="mt-2 border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-indigo-400">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </label>

        <button
          type="submit"
          disabled={!stripe || loading || !paymentList.length}
          className={`w-full py-3 rounded-md text-white font-semibold transition-colors duration-300
            ${
              !stripe || loading || !paymentList.length
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
            }`}
        >
          {loading ? 'กำลังดำเนินการ...' : 'ชำระเงินทั้งหมด'}
        </button>
      </form>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-50 via-white to-indigo-50 p-6">
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </main>
  );
}
