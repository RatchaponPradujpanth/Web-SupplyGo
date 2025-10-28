'use client';

import React, { useEffect, useState } from "react";
import { creategroup, CreateGroupRequest, CreateGroupResponse } from "@/service/api/groupsharing/creategroup";
import { loadproduct } from "@/service/api/shopproduct";
import type { Product } from "@/types/type";

export default function CreateGroupPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [required_members, setRequiredMembers] = useState<number>(1);
  const [total_items, setTotalItems] = useState<number>(1);
  const [items_per_member, setItemsPerMember] = useState<number>(1); // เพิ่มตรงนี้
  const [status, setStatus] = useState<string>("open");
  const [points_per_group, setPointsPerGroup] = useState<number>(0);
  const [points_per_member, setPointsPerMember] = useState<number>(0);
  const [group_name, setGroupName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [expire_at, setExpireAt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const selectedProduct = products.find(p => p.product_id === selectedProductId);
  const hasVariants = selectedProduct?.product_variants && selectedProduct.product_variants.length > 0;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchProducts = async () => {
      const productsData = await loadproduct(token);
      if (productsData && Array.isArray(productsData)) setProducts(productsData);
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !selectedProductId) return;

    const payload: CreateGroupRequest = {
      product_id: selectedProductId,
      variant_id: selectedVariantId,
      required_members,
      total_items,
      items_per_member,
      status,
      points_per_group,
      points_per_member,
      group_name,
      description,
      expire_at
    };

    try {
      setLoading(true);
      const response: CreateGroupResponse = await creategroup(token, payload);
      setMessage(response.message);
    } catch (error) {
      setMessage(` Error:เกิดข้อผิดพลาด`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">สร้าง Group Buying</h1>
      {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block mb-1 font-medium">Group Name</label>
          <input type="text" value={group_name} onChange={e => setGroupName(e.target.value)} className="border p-2 w-full rounded" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full rounded" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Expire At</label>
          <input type="datetime-local" value={expire_at} onChange={e => setExpireAt(e.target.value)} className="border p-2 w-full rounded" />
        </div>

        {/* Product */}
        <div>
          <label className="block mb-1 font-medium">สินค้า</label>
          <select value={selectedProductId ?? ""} onChange={e => setSelectedProductId(Number(e.target.value))} className="border p-2 w-full rounded">
            <option value="">เลือกสินค้า</option>
            {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
          </select>
        </div>

        {/* Variant */}
        {hasVariants && (
          <div>
            <label className="block mb-1 font-medium">Variant</label>
            <select value={selectedVariantId ?? ""} onChange={e => setSelectedVariantId(Number(e.target.value))} className="border p-2 w-full rounded">
              <option value="">เลือก Variant</option>
              {selectedProduct?.product_variants?.map(v => (
                <option key={v.variant_id} value={v.variant_id}>
                  {v.variant_options?.map(vo => `${vo.option_name}: ${vo.value}`).join(", ")} (Stock: {v.total_stock})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* จำนวนสมาชิก / สินค้า / items_per_member */}
        <div>
          <label className="block mb-1 font-medium">จำนวนสมาชิกที่ต้องการ</label>
          <input type="number" min={1} value={required_members} onChange={e => setRequiredMembers(Number(e.target.value))} className="border p-2 w-full rounded" />
        </div>

        <div>
          <label className="block mb-1 font-medium">จำนวนสินค้าต่อกลุ่ม</label>
          <input type="number" min={1} value={total_items} onChange={e => setTotalItems(Number(e.target.value))} className="border p-2 w-full rounded" />
        </div>

        <div>
          <label className="block mb-1 font-medium">จำนวนสินค้าต่อสมาชิก</label>
          <input type="number" min={1} value={items_per_member} onChange={e => setItemsPerMember(Number(e.target.value))} className="border p-2 w-full rounded" />
        </div>

        {/* Status */}
        <div>
          <label className="block mb-1 font-medium">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="border p-2 w-full rounded">
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Points */}
        <div>
          <label className="block mb-1 font-medium">Points ต่อ Group</label>
          <input type="number" min={0} value={points_per_group} onChange={e => setPointsPerGroup(Number(e.target.value))} className="border p-2 w-full rounded" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Points ต่อสมาชิก</label>
          <input type="number" min={0} value={points_per_member} onChange={e => setPointsPerMember(Number(e.target.value))} className="border p-2 w-full rounded" />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {loading ? "กำลังสร้าง..." : "สร้าง Group"}
        </button>
      </form>
    </div>
  );
}
