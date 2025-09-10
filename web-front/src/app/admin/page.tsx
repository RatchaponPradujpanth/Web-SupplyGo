"use client";

import { useEffect, useState } from "react";
import { admindashboard } from "@/service/api/adminDashboard";
import type { AdminDashboardApiResponse } from "@/types/type";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found");
          setLoading(false);
          return;
        }
        const res = await admindashboard(token);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="p-6 text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-6 text-gray-600">No data available</div>;

  const { dashboard } = data;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-4 bg-white rounded-xl shadow">
          <h2 className="text-sm text-gray-500">Users</h2>
          <p className="text-2xl font-semibold">{dashboard?.totalUsers ?? 0}</p>
        </div>

        <div className="p-4 bg-white rounded-xl shadow">
          <h2 className="text-sm text-gray-500">Shops</h2>
          <p className="text-2xl font-semibold">{dashboard?.totalStores ?? 0}</p>
        </div>

        <div className="p-4 bg-white rounded-xl shadow">
          <h2 className="text-sm text-gray-500">Products</h2>
          <p className="text-2xl font-semibold">{dashboard?.totalProducts ?? 0}</p>
        </div>

        <div className="p-4 bg-white rounded-xl shadow">
          <h2 className="text-sm text-gray-500">Orders</h2>
          <p className="text-2xl font-semibold">{dashboard?.totalOrders ?? 0}</p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-2">Order ID</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Total Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Order Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.recentOrders?.map((o) => (
                <tr key={o.order_id} className="border-b">
                  <td className="px-4 py-2">{o.order_id}</td>
                  <td className="px-4 py-2">
                    {Array.isArray(o.users) && o.users.length > 0
                      ? o.users.map(u => u.username).join(", ")
                      : "-"
                    }
                  </td>
                  <td className="px-4 py-2">{o.total_amount ?? "-"}</td>
                  <td className="px-4 py-2">{o.status ?? "-"}</td>
                  <td className="px-4 py-2">
                    {o.order_date 
                      ? new Date(o.order_date).toLocaleString()
                      : "-"
                    }
                  </td>
                </tr>
              )) ?? null}
            </tbody>
          </table>
        </div>
      </div>
      {/* Recent Products Table */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Products</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-2">Product ID</th>
                <th className="px-4 py-2">Product Name</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Shop(s)</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.recentProducts?.map((p) => (
                <tr key={p.product_id} className="border-b">
                  <td className="px-4 py-2">{p.product_id}</td>
                  <td className="px-4 py-2">{p.product_name}</td>
                  <td className="px-4 py-2">
                    {p.price ? `฿${Number(p.price).toLocaleString()}` : "-"}
                  </td>
                  <td className="px-4 py-2">
                    {p.product_owners?.length > 0
                      ? p.product_owners.map(owner => owner.shops.shop_name).join(", ")
                      : "-"
                    }
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      p.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {p.status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {p.created_date 
                      ? new Date(p.created_date).toLocaleDateString()
                      : "-"
                    }
                  </td>
                </tr>
              )) ?? null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}