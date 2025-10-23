"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { loadShopProducts } from "@/service/api/loadproduct";
import { Product } from "@/types/type";
import { updateStatus } from "@/service/api/shop/updatestatus";

export default function ShopProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("❌ Token not found");
          setLoading(false);
          return;
        }

        const res = await loadShopProducts(token);
        console.log("✅ [ShopProductsList] Loaded products:", res);
        setProducts(res);
      } catch (error) {
        console.error("❌ Error loading products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading)
    return <div className="p-6 text-center">⏳ กำลังโหลดสินค้า...</div>;
  if (products.length === 0)
    return <div className="p-6 text-center">🛒 ยังไม่มีสินค้าในร้านของคุณ</div>;

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.product_id}
          className="bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition-all duration-200"
        >
          {/* รูปสินค้า */}
          <div className="relative w-full h-48 mb-3">
            <Image
              src={
                product.image ||
                product.product_images?.[0]?.image_url ||
                "/placeholder.png"
              }
              alt={product.product_name || "Product Image"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover rounded-lg"
            />
          </div>

          {/* ชื่อ / หมวดหมู่ */}
          <h2 className="text-lg font-semibold line-clamp-1 mb-1">
            {product.product_name}
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            หมวดหมู่: {product.category_name || "-"}
          </p>

          {/* รายละเอียดสินค้า */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-3">
            {product.product_description || "ไม่มีคำอธิบายสินค้า"}
          </p>

          {/* ราคา / ช่วงราคา */}
          {product.product_variants && product.product_variants.length > 0 ? (
            (() => {
              const prices = product.product_variants.map((v) => v.price ?? 0);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              return (
                <p className="text-green-600 font-bold text-lg mb-2">
                  ฿{minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`}
                </p>
              );
            })()
          ) : (
            <p className="text-green-600 font-bold text-lg mb-2">
              ฿{product.price ?? 0}
            </p>
          )}

          {/* ตัวเลือกสินค้า */}
          {product.product_options && product.product_options.length > 0 && (
            <div className="border-t border-gray-200 pt-2 mt-2 text-sm text-gray-700">
              <p className="font-semibold text-gray-800 mb-1">ตัวเลือกสินค้า:</p>
              {product.product_options.map((option) => (
                <div key={option.option_id} className="ml-2 mb-1">
                  <span className="font-medium">{option.name}:</span>{" "}
                  {Array.from(
                    new Set(option.variant_options.map((v) => v.value))
                  ).join(", ")}
                </div>
              ))}
            </div>
          )}

          {/* รายการ Variant */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="mt-3 border-t border-gray-200 pt-2">
              <p className="font-semibold text-gray-800 text-sm mb-1">
                รายการตัวเลือกทั้งหมด:
              </p>
              <div className="max-h-36 overflow-y-auto text-sm space-y-1">
                {product.product_variants.map((variant) => (
                  <div
                    key={variant.variant_id}
                    className="bg-gray-50 p-2 rounded-md"
                  >
                    <p className="font-medium">
                      {variant.variant_options
                        .map((v) => `${v.option_name}: ${v.value}`)
                        .join(" / ")}
                    </p>
                    <p className="text-gray-600">
                      SKU: {variant.sku || "-"} | ราคา: ฿{variant.price ?? 0} | สต็อก:{" "}
                      {variant.total_stock ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Batch */}
          {product.product_batches && product.product_batches.length > 0 && (
            <div className="mt-3 border-t border-gray-200 pt-2 text-sm text-gray-700">
              <p className="font-semibold text-gray-800 mb-1">ข้อมูล Batch:</p>
              {product.product_batches.map((batch, index) => (
                <div key={index}>
                  <p>🧾 Batch: {batch.batch_number ?? "-"}</p>
                  <p>📦 จำนวน: {batch.quantity ?? 0}</p>
                  <p>
                    ⏰ หมดอายุ:{" "}
                    {batch.expiry_date
                      ? new Date(batch.expiry_date).toLocaleDateString("th-TH")
                      : "-"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ร้าน */}
          {product.shop && product.shop.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              🏪 ร้าน: {product.shop[0].shop_name}
            </p>
          )}

          {/* สถานะ + ปุ่มเปลี่ยนสถานะ */}
          <div className="mt-3 flex items-center justify-between">
            <div
              className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                product.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {product.status === "active" ? "กำลังขาย" : "ปิดการขาย"}
            </div>

            <button
              className="ml-2 text-sm px-2 py-1 border rounded hover:bg-gray-100"
              onClick={async () => {
                const newStatus = product.status === "active" ? "inactive" : "active";
                try {
                  await updateStatus(product.product_id, newStatus);
                  setProducts((prev) =>
                    prev.map((p) =>
                      p.product_id === product.product_id
                        ? { ...p, status: newStatus }
                        : p
                    )
                  );
                } catch (error) {
                  alert("❌ เปลี่ยนสถานะไม่สำเร็จ");
                  console.error(error);
                }
              }}
            >
              เปลี่ยนสถานะ
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
