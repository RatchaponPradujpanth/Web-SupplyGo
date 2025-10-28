import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ amount, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      // Create payment method
      const { error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setErrorMessage(error.message || 'การชำระเงินล้มเหลว');
        setProcessing(false);
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      onSuccess();
    } catch {
      setErrorMessage('เกิดข้อผิดพลาดในการชำระเงิน');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          ข้อมูลบัตร
        </label>
        <div className="p-4 border-2 border-gray-300 rounded-xl focus-within:border-orange-500 transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={processing || !stripe}
          className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'กำลังดำเนินการ...' : `ชำระเงิน ฿${amount.toLocaleString()}`}
        </button>
      </div>
    </form>
  );
}
