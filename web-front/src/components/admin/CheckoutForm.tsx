import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { approveWithdrawal } from "@/service/api/groupsharing/admin/approvewithdraw";

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

interface CheckoutFormProps {
  withdrawal: Withdrawal;
  token: string;
  onSuccess: () => void;
}

export default function CheckoutForm({ withdrawal, token, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const res = await approveWithdrawal(token, withdrawal.store_withdrawals_id);
      const clientSecret = res.clientSecret;
      if (!clientSecret) throw new Error("clientSecret ไม่ถูกส่งมา");

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("CardElement ไม่พบ");

      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert("❌ ล้มเหลว: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="border p-3 rounded mb-4">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "กำลังทำรายการ..." : `จ่าย ${withdrawal.points.toLocaleString()} บาท`}
      </button>
    </form>
  );
}