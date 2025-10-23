// src/components/ShopGraphDashboard.tsx
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

interface ShopGraphDashboardProps {
  token: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;
}

export default function ShopGraphDashboard({ token, startDate, endDate }: ShopGraphDashboardProps) {
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

  if (loading) return <div>Loading...</div>;
  if (!graphData) return <div>No data available</div>;

  // แปลง dailySales เป็น array สำหรับ LineChart
  const dailySalesArray = Object.entries(graphData.dailySales).map(([date, total]) => ({
    date,
    total,
  }));

  const productSalesArray: ProductSales[] = graphData.productSales;

  return (
    <div className="space-y-10 p-4">
      {/* ยอดขายรายวัน */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4">ยอดขายรายวัน</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailySalesArray} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ยอดขายแยกสินค้า */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4">ยอดขายแยกสินค้า</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={productSalesArray}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            barCategoryGap="20%"
          >
            <defs>
              <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#82ca9d" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="product_name"
              angle={-35} // เอียงชื่อสินค้าอ่านง่าย
              textAnchor="end"
              interval={0} // แสดงทุกชื่อ
              height={70} // เว้นพื้นที่เอียง
            />
            <YAxis />
            <Tooltip formatter={(value: number) => [`${value} ชิ้น`, "จำนวนขาย"]} />
            <Legend />
           <Bar
  dataKey="quantity_sold"
  fill="url(#colorQuantity)"
  name="จำนวนขาย"
  radius={[5, 5, 0, 0]} // มุมบนเป็นโค้ง
  label={{
    position: "top",
    formatter: (props: any) => {
      const { value } = props;
      return value;
    },
  }}
/>

          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
