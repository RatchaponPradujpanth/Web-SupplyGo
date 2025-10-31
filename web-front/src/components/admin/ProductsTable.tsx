'use client';

import React, { useEffect, useState } from "react";
import { loadPublicProducts } from "@/service/api/loadproduct";

interface Product {
  product_id: number;
  product_name: string | null;
  price: number | null;
  status: string | null;
  product_images?: Array<{ image_url: string }>;
}

export default function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ Token not found");
      setLoading(false);
      return;
    }

    loadPublicProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>กำลังโหลดสินค้า...</div>;

  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h2 className="font-semibold mb-3">สินค้าทั้งหมด</h2>
      <table className="w-full text-sm">
        <thead className="text-left text-textmuted">
          <tr>
            <th className="p-3">รหัสสินค้า</th>
            <th className="p-3">ชื่อ</th>
            <th className="p-3">ราคา</th>
            <th className="p-3">สถานะ</th>
            <th className="p-3">รูปภาพ</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.product_id} className="border-t">
              <td className="p-3">{p.product_id}</td>
              <td className="p-3">{p.product_name ?? "-"}</td>
              <td className="p-3">฿{p.price ?? "-"}</td>
              <td className="p-3">{p.status ?? "-"}</td>
              <td className="p-3">
                {p.product_images?.length ? (
                  <img
                    src={p.product_images[0].image_url}
                    alt={p.product_name ?? ""}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
