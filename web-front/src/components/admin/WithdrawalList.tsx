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

interface WithdrawalListProps {
  withdrawals: Withdrawal[];
  onApprove: (withdrawal: Withdrawal) => void;
}

export default function WithdrawalList({ withdrawals, onApprove }: WithdrawalListProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h2 className="font-semibold mb-3">คำร้องถอนเงินที่รออนุมัติ</h2>
      {withdrawals.length === 0 ? (
        <p className="text-textmuted text-center py-8">ไม่มีคำร้องรออนุมัติ</p>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((w, index) => (
            <div
              key={`${w.store_withdrawals_id}-${index}`}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold">{w.store.shop_name}</div>
                  <div className="text-sm text-textmuted">
                    รหัสการถอนเงิน: {w.store_withdrawals_id}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  {w.status}
                </span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-textmuted">จำนวนเงิน:</span>
                  <span className="font-semibold">฿{w.points.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textmuted">วันที่ขอถอน:</span>
                  <span>{new Date(w.requested_at).toLocaleString("th-TH")}</span>
                </div>
                {w.store.stripe_account_id && (
                  <div className="flex justify-between">
                    <span className="text-textmuted">Stripe Account:</span>
                    <span className="text-xs font-mono">
                      {w.store.stripe_account_id.substring(0, 20)}...
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onApprove(w)}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                อนุมัติและจ่ายเงิน
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}