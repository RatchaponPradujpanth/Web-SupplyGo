"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getGraphSell } from "@/service/api/shop/graphsell";
import { GraphSellResponse, ProductSales } from "@/types/type";
import { Loader2, LineChart as LineIcon, BarChart3 } from "lucide-react";

interface ShopGraphDashboardProps {
  token: string;
  startDate: string;
  endDate: string;
}

export default function ShopGraphDashboard({
  token,
  startDate,
  endDate,
}: ShopGraphDashboardProps) {
  const [graphData, setGraphData] = useState<GraphSellResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getGraphSell(token, startDate, endDate);
        setGraphData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, startDate, endDate]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" /> กำลังโหลดข้อมูล...
      </div>
    );

  if (!graphData)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        ไม่มีข้อมูลให้แสดง
      </div>
    );

  const dailySalesArray = Object.entries(graphData.dailySales).map(
    ([date, total]) => ({
      date,
      total,
    })
  );

  const productSalesArray: ProductSales[] = graphData.productSales;

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* --- กราฟยอดขายรายวัน --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <LineIcon className="text-indigo-600 w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">
            ยอดขายรายวัน
          </h2>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={dailySalesArray} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "10px",
                border: "1px solid #ddd",
                fontSize: "13px",
              }}
              formatter={(value: number) => [`฿${value.toLocaleString()}`, "ยอดขาย"]}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#6366F1" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* --- กราฟยอดขายแยกตามสินค้า --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <BarChart3 className="text-emerald-600 w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">
            ยอดขายแยกตามสินค้า
          </h2>
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={productSalesArray}
            margin={{ top: 10, right: 20, left: 0, bottom: 70 }}
            barCategoryGap="25%"
          >
            <defs>
              <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="product_name"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "10px",
                border: "1px solid #ddd",
                fontSize: "13px",
              }}
              formatter={(value: number) => [`${value} ชิ้น`, "จำนวนขาย"]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: "13px", color: "#555" }}
            />
            <Bar
              dataKey="quantity_sold"
              fill="url(#colorQuantity)"
              name="จำนวนขาย"
              radius={[8, 8, 0, 0]}
              label={{
                position: "top",
                style: { fill: "#374151", fontSize: 12, fontWeight: 500 },
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
