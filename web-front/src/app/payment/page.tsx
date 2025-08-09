// src/app/payment/PaymentForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import {
  cartUser,
  loadaddress,
  createMultiVendorPayment,
  submitOrder,
  ShopPaymentIntent,
} from '@/service/apis';
import { motion, AnimatePresence } from 'framer-motion';
import { savetransaction } from '@/service/api/savetranscation';

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

interface Address {
  address_id: number;
  firstname: string;
  lastname: string;
  phone_number: string;
  house_number: string;
  street: string;
  sub_district: string;
  district: string;
  province: string;
  postal_code: string;
  address_type: string;
}

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentFormContent() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [paymentList, setPaymentList] = useState<ShopPaymentIntent[]>([]);
  const [cartId, setCartId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [paidSuccess, setPaidSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'ไม่พบโทเค็นผู้ใช้ กรุณาเข้าสู่ระบบ' });
      return;
    }

    const loadPaymentFlow = async () => {
      try {
        const cartData = await cartUser(token);
        const addressList = await loadaddress(token);

        if (!cartData.cart_id) {
          setMessage({ type: 'error', text: 'ไม่พบข้อมูลตะกร้า' });
          return;
        }
        if (!addressList || addressList.length === 0) {
          setMessage({ type: 'error', text: 'ไม่พบข้อมูลที่อยู่' });
          return;
        }

        setCartId(cartData.cart_id);
        setAddresses(addressList);
        setAddressId(addressList[0].address_id);

        const paymentRes = await createMultiVendorPayment(token, cartData.cart_id);
        setPaymentList(paymentRes.paymentIntents);
        setMessage(null);
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'โหลดข้อมูลการชำระเงินล้มเหลว' });
      }
    };

    loadPaymentFlow();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage({ type: 'error', text: 'ยังไม่พร้อมสำหรับการชำระเงิน' });
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement || !cartId || !addressId) {
      setMessage({ type: 'error', text: 'ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบที่อยู่และข้อมูลบัตร' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');

      for (const [index, payment] of paymentList.entries()) {
         console.log("Saving transaction for payment:", payment);
        setMessage({ type: 'info', text: `กำลังชำระเงินร้าน ${payment.shop_id} (${index + 1}/${paymentList.length})` });

        const { error, paymentIntent } = await stripe.confirmCardPayment(payment.client_secret, {
          payment_method: { card: cardElement },
        });

        if (error || paymentIntent?.status !== 'succeeded') {
          throw new Error(`ร้าน ${payment.shop_id} ชำระเงินไม่สำเร็จ: ${error?.message || paymentIntent?.status}`);
        }

        await savetransaction(token, payment.shop_id, payment.order_shop_id, paymentIntent.id);
      }

      await submitOrder(token, cartId, addressId);

      setMessage({ type: 'success', text: '✅ ชำระเงินและบันทึกออเดอร์สำเร็จ!' });
      setPaidSuccess(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'เกิดข้อผิดพลาดขณะชำระเงิน' });
      setPaidSuccess(false);
    } finally {
      setLoading(false);
    }
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

      <AnimatePresence>
        {paidSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-6 text-center"
          >
            <button
              onClick={() => router.push('/home')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition"
            >
              กลับไปหน้า Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!paymentList.length && !message && (
        <p className="text-center text-gray-500 animate-pulse">⏳ กำลังโหลดข้อมูล...</p>
      )}

      {!paidSuccess && (
        <>
          <div className="mb-6">
            <label className="block font-semibold mb-2">เลือกที่อยู่จัดส่ง</label>
            <select
              value={addressId !== null ? addressId.toString() : ''}
              onChange={(e) => setAddressId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              {addresses.map((addr) => (
                <option key={addr.address_id} value={addr.address_id.toString()}>
                  {addr.firstname} {addr.lastname} - {addr.house_number} {addr.street}, {addr.district}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block text-gray-700 font-semibold">
              ข้อมูลบัตร
              <div className="mt-2 border border-gray-300 rounded-md p-3">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </label>

            <button
              type="submit"
              disabled={!stripe || loading || !paymentList.length}
              className={`w-full py-3 rounded-md text-white font-semibold ${
                !stripe || loading || !paymentList.length
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'กำลังชำระเงิน...' : 'ชำระเงินทั้งหมด'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function PaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent />
    </Elements>
  );
}