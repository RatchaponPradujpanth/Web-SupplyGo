import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

interface PaymentModalProps {
  withdrawal: Withdrawal;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
  withdrawal,
  token,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-w-full mx-4">
        <h2 className="text-lg font-bold mb-4">กรอกบัตรเพื่อจ่ายเงิน</h2>
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-textmuted">ร้าน: {withdrawal.store.shop_name}</div>
          <div className="text-lg font-semibold">
            จำนวน: ฿{withdrawal.points.toLocaleString()}
          </div>
        </div>
        <Elements stripe={stripePromise}>
          <CheckoutForm
            withdrawal={withdrawal}
            token={token}
            onSuccess={onSuccess}
          />
        </Elements>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}