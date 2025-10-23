// src/app/payment/PaymentForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { loadaddress, createMultiVendorPayment } from '@/service/apis';
import { savetransaction } from '@/service/api/savetranscation';
import { motion, AnimatePresence } from 'framer-motion';
import { cancelorder } from '@/service/api/cancelorder';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1a202c',
      fontSize: '16px',
      fontFamily: '"Poppins", sans-serif',
      '::placeholder': { color: '#a0aec0' },
      iconColor: '#4a5568',
      padding: '12px 14px',
    },
    invalid: { color: '#e53e3e', iconColor: '#e53e3e' },
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

export interface OrderItemForFrontend {
  product_id: number;
  product_name?: string | null;
  variant_option?: { value: string; option_name: string; sku: string } | null;
  quantity?: number | null;
  price_per_unit?: number | null;
  total_price?: number | null;
}

export interface ShopPaymentIntentForFrontend {
  shop_id: number;
  shop_name: string;
  amount: number;
  client_secret: string;
  stripe_account: string;
  order_shop_id: number;
  order_items?: OrderItemForFrontend[];
}

export interface PaymentResponse {
  message: string;
  order_id: number;
  total_amount: number;
  total_payment_intents: number;
  paymentIntents: ShopPaymentIntentForFrontend[];
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentFormContent() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [paymentList, setPaymentList] = useState<ShopPaymentIntentForFrontend[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{ total_amount: number } | null>(null);

  useEffect(() => {
    const loadPaymentFlow = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage({ type: 'error', text: 'ไม่พบโทเค็นผู้ใช้ กรุณาเข้าสู่ระบบ' });
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const orderIdFromUrl = urlParams.get('orderId');
        const orderIdToSend = orderIdFromUrl ? Number(orderIdFromUrl) : undefined;

        const addressList = await loadaddress(token);
        if (!addressList || addressList.length === 0) {
          setMessage({ type: 'error', text: 'ไม่พบข้อมูลที่อยู่ กรุณาเพิ่มที่อยู่จัดส่ง' });
          return;
        }
        setAddresses(addressList);
        setAddressId(addressList[0].address_id);

        const paymentRes: PaymentResponse = await createMultiVendorPayment(token, orderIdToSend);

        setPaymentList(paymentRes.paymentIntents);
        setOrderId(paymentRes.order_id);
        setOrderInfo({ total_amount: paymentRes.total_amount });

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
    if (!cardElement || !orderId || !addressId) {
      setMessage({ type: 'error', text: 'ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบที่อยู่และข้อมูลบัตร' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');

      for (const [index, payment] of paymentList.entries()) {
        setMessage({
          type: 'info',
          text: `กำลังชำระเงินร้าน ${payment.shop_name} (${index + 1}/${paymentList.length})`,
        });

        const { error, paymentIntent } = await stripe.confirmCardPayment(payment.client_secret, {
          payment_method: { card: cardElement },
        });

        if (error || paymentIntent?.status !== 'succeeded') {
          throw new Error(`ร้าน ${payment.shop_name} ชำระเงินไม่สำเร็จ: ${error?.message || paymentIntent?.status}`);
        }

        await savetransaction(token, payment.shop_id, payment.order_shop_id, paymentIntent.id);
      }

      setMessage({ type: 'success', text: '✅ ชำระเงินสำเร็จ! ระบบกำลังรอ webhook เพื่ออัปเดตสถานะ' });
      setPaidSuccess(true);

      setTimeout(() => {
        router.push('/orderhistory');
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'เกิดข้อผิดพลาดขณะชำระเงิน' });
      setPaidSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) {
      setMessage({ type: 'error', text: 'ไม่พบ Order ID' });
      return;
    }

    const confirmCancel = window.confirm('คุณแน่ใจหรือว่าต้องการยกเลิกคำสั่งซื้อนี้?');
    if (!confirmCancel) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');

      const cancelRes = await cancelorder(token, orderId);

      if (cancelRes.status === 'cancelled') {
        setMessage({ type: 'success', text: 'ยกเลิกคำสั่งซื้อสำเร็จ' });
        setPaymentList([]);
      } else {
        setMessage({ type: 'error', text: 'ไม่สามารถยกเลิกคำสั่งซื้อได้' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'เกิดข้อผิดพลาดขณะยกเลิกคำสั่งซื้อ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">💳 ชำระเงิน</h1>

      {orderInfo && (
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <h2 className="font-semibold text-gray-700 mb-2">ข้อมูลคำสั่งซื้อ</h2>
    <p>ยอดรวม: ฿{orderInfo.total_amount?.toLocaleString() || '0'}</p>
    <p>จำนวนร้านค้า: {paymentList.length} ร้าน</p>
  </div>
)}


      {paymentList.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">รายละเอียดการชำระเงิน</h3>
          {paymentList.map((payment) => (
            <div key={payment.order_shop_id} className="mb-3 p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{payment.shop_name}</span>
                <span className="text-lg font-bold">฿{payment.amount.toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-600">
                {payment.order_items && payment.order_items.length > 0 ? (
                  <>
                    <p>จำนวนสินค้า: {payment.order_items.length} รายการ</p>
                    {payment.order_items.map((item, idx) => (
                      <div key={idx} className="ml-2 text-xs">
                        • {item.product_name || 'ไม่ระบุชื่อสินค้า'}
                        {item.variant_option
                          ? ` (${item.variant_option.option_name}: ${item.variant_option.value})`
                          : ''}
                        × {item.quantity ?? 0} = ฿{Number(item.total_price ?? 0).toLocaleString()}
                      </div>
                    ))}
                  </>
                ) : (
                  <p>ไม่มีข้อมูลสินค้า</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
              onClick={() => router.push('/orders')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition"
            >
              ดูคำสั่งซื้อ
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!paidSuccess && paymentList.length > 0 && (
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
              disabled={!stripe || loading || paymentList.length === 0 || !addressId || !orderId}
              className={`w-full py-3 rounded-md text-white font-semibold ${
                !stripe || loading || paymentList.length === 0 || !addressId || !orderId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading
                ? 'กำลังชำระเงิน...'
                : `ชำระเงิน ฿${paymentList.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`}
            </button>
          </form>
        </>
      )}

      <button
        type="button"
        onClick={handleCancelOrder}
        disabled={loading || !orderId}
        className="flex-1 mt-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md font-semibold"
      >
        {loading ? 'กำลังยกเลิก...' : 'ยกเลิกคำสั่งซื้อ'}
      </button>
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
