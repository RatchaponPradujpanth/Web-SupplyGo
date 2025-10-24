import type { PaymentHistoryOrder } from "@/types/type";

interface PaymentsTableProps {
  paymentData: PaymentHistoryOrder[];
}

export default function PaymentsTable({ paymentData }: PaymentsTableProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h2 className="font-semibold mb-3">Payment History</h2>
      <table className="w-full text-sm">
        <thead className="text-left text-textmuted">
          <tr>
            <th className="p-3">Order ID</th>
            <th className="p-3">Shop</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
            <th className="p-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {paymentData.map((order) =>
            order.order_shops.map((shop) => (
              <tr key={shop.order_shop_id} className="border-t">
                <td className="p-3">{order.order_id}</td>
                <td className="p-3">{shop.shops.shop_name ?? "-"}</td>
                <td className="p-3">฿{shop.subtotal ?? "-"}</td>
                <td className="p-3">{shop.status ?? "-"}</td>
                <td className="p-3">
                  {order.order_date ? new Date(order.order_date).toLocaleString() : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}