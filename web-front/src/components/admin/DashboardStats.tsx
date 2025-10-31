interface DashboardStatsProps {
  totalUsers: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
}

export default function DashboardStats({
  totalUsers,
  totalStores,
  totalProducts,
  totalOrders,
}: DashboardStatsProps) {
  const stats = [
    { label: "ผู้ใช้", value: totalUsers },
    { label: "ร้านค้า", value: totalStores },
    { label: "สินค้า", value: totalProducts },
    { label: "ออเดอร์", value: totalOrders },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-card shadow-card p-4">
          <div className="text-xs text-textmuted">{stat.label}</div>
          <div className="text-xl font-semibold mt-1">{stat.value ?? 0}</div>
        </div>
      ))}
    </div>
  );
}