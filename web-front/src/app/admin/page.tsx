'use client';

import React, { useEffect, useState } from 'react';
import { getPendingWithdrawals } from '@/service/api/groupsharing/admin/getPendingWithdrawals';
import { approveWithdrawal } from '@/service/api/groupsharing/admin/approvewithdraw';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface Withdrawal {
  store_withdrawals_id: number;
  shop_id: number;
  points: number;
  status: string;
  requested_at: string;
  store: {
    shop_name: string;
    stripe_account_id: string;
  };
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function AdminWithdrawPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentWithdrawal, setCurrentWithdrawal] = useState<Withdrawal | null>(null);

  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      router.push('/login');
      return;
    }
    setToken(t);

    const fetchData = async () => {
      try {
        const res = await getPendingWithdrawals(t);
        setWithdrawals(res.withdrawals || []);
      } catch (error) {
        console.error("โหลด pending withdrawals ล้มเหลว:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const openModal = (w: Withdrawal) => {
    setCurrentWithdrawal(w);
    setModalOpen(true);
  };

  const closeModal = () => {
    setCurrentWithdrawal(null);
    setModalOpen(false);
  };

  if (loading) return <div className="p-6">⏳ กำลังโหลด...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">คำร้องถอนเงินที่รออนุมัติ</h1>
      {withdrawals.length === 0 ? (
        <p>ไม่มีคำร้องรออนุมัติ</p>
      ) : (
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">ร้าน</th>
              <th className="border px-4 py-2">จำนวน (points)</th>
              <th className="border px-4 py-2">วันที่ร้องขอ</th>
              <th className="border px-4 py-2">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(w => (
              <tr key={w.store_withdrawals_id}>
                <td className="border px-4 py-2">{w.store.shop_name}</td>
                <td className="border px-4 py-2">{w.points}</td>
                <td className="border px-4 py-2">{new Date(w.requested_at).toLocaleString()}</td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => openModal(w)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    อนุมัติ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && currentWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">กรอกบัตรเพื่อจ่ายเงิน</h2>
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                withdrawal={currentWithdrawal} 
                token={token!} 
                onSuccess={() => {
                  setWithdrawals(prev => prev.filter(w => w.store_withdrawals_id !== currentWithdrawal.store_withdrawals_id));
                  closeModal();
                }} 
              />
            </Elements>
            <button onClick={closeModal} className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CheckoutFormProps {
  withdrawal: Withdrawal;
  token: string;
  onSuccess: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ withdrawal, token, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // 1️⃣ สร้าง PaymentIntent ผ่าน backend
      const res = await approveWithdrawal(token, withdrawal.store_withdrawals_id);
      const clientSecret = res.clientSecret;
      if (!clientSecret) throw new Error("clientSecret ไม่ถูกส่งมา");

      // 2️⃣ confirm PaymentIntent ด้วย CardElement
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("CardElement ไม่พบ");

      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      // ✅ สำเร็จ
      onSuccess();
      alert("✅ จ่ายเงินและอนุมัติสำเร็จ");

    } catch (err: any) {
      console.error(err);
      alert("❌ ล้มเหลว: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="border p-2 rounded mb-4">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
      >
        {loading ? 'กำลังทำรายการ...' : `จ่าย ${withdrawal.points} บาท`}
      </button>
    </form>
  );
};
