interface Order {
  order_id: number;
  total_amount: number | null;
  status: string | null;
  order_date: string | null;
  users?: {
    username: string | null;
  };
}

interface RecentOrdersProps {
  orders: Order[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h2 className="font-semibold mb-3">ออเดอร์ล่าสุด</h2>
      <table className="w-full text-sm">
        <thead className="text-left text-textmuted">
          <tr>
            <th className="p-3">รหัสออเดอร์</th>
            <th className="p-3">ผู้ใช้</th>
            <th className="p-3">ราคารวม</th>
            <th className="p-3">สถานะ</th>
            <th className="p-3">วันที</th>
          </tr>
        </thead>
        <tbody>
          {orders?.map((o) => (
            <tr key={o.order_id} className="border-t">
              <td className="p-3">{o.order_id}</td>
              <td className="p-3">{o.users?.username ?? "-"}</td>
              <td className="p-3">฿{o.total_amount ?? "-"}</td>
              <td className="p-3">{o.status ?? "-"}</td>
              <td className="p-3">
                {o.order_date ? new Date(o.order_date).toLocaleString() : "-"}
              </td>
            </tr>
          )) ?? null}
        </tbody>
      </table>
    </div>
  );
}