'use client';

import React, { useEffect, useState } from "react";
import { creategroup, CreateGroupRequest, CreateGroupResponse } from "@/service/api/groupsharing/creategroup";
import { loadproduct } from "@/service/api/shopproduct";
import type { Product } from "@/types/type";
import {
  Sparkles,
  Search,
  Users,
  Package,
  Gift,
  Calendar,
  Loader2,
  Rocket,
  CheckCircle,
  XCircle,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

export default function CreateGroupForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [required_members, setRequiredMembers] = useState<number>(1);
  const [items_per_member, setItemsPerMember] = useState<number>(1);
  const [status, setStatus] = useState<string>("open");
  const [points_per_group, setPointsPerGroup] = useState<number>(0);
  const [group_name, setGroupName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [expire_at, setExpireAt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const selectedProduct = products.find(p => p.product_id === selectedProductId);
  const hasVariants = selectedProduct?.product_variants && selectedProduct.product_variants.length > 0;

  // 🎯 Auto calculate
  const total_items = required_members * items_per_member;
  const points_per_member = required_members > 0 ? Math.floor(points_per_group / required_members) : 0;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchProducts = async () => {
      try {
        const productsData = await loadproduct(token);
        if (productsData && Array.isArray(productsData)) setProducts(productsData);
      } catch (e) {
         console.error("Failed to load products:", e);
      }
    };
    fetchProducts();
  }, []);

  const productImage = selectedProduct?.image ?? selectedProduct?.product_images?.find(pi => pi.is_primary === true)?.image_url ?? selectedProduct?.product_images?.[0]?.image_url ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !selectedProductId) {
        setMessage({ text: "กรุณาเข้าสู่ระบบและเลือกสินค้า", type: 'error' });
        return;
    }

    if (!group_name.trim()) {
      setMessage({ text: 'กรุณากรอกชื่อกลุ่ม', type: 'error' });
      return;
    }

    const payload: CreateGroupRequest = {
      product_id: selectedProductId,
      variant_id: hasVariants ? selectedVariantId : null,
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
      setMessage({ text: response.message || "สร้างกลุ่มสำเร็จ!", type: 'success' });
    } catch (error) {
      setMessage({ text: "เกิดข้อผิดพลาดในการสร้างกลุ่ม", type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 lg:p-12 w-full max-w-[90%] lg:max-w-6xl mx-auto my-10 bg-white rounded-2xl shadow-xl border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-center justify-center gap-3 mb-6 pb-4 border-b">
        <Sparkles className="w-8 h-8 text-indigo-600" />
        <h1 className="text-3xl font-extrabold text-center text-indigo-700">
          สร้าง Group Buying ใหม่
        </h1>
      </div>

      {message && <Alert message={message} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Group 1: Group Details */}
        <InputGroup title="1. รายละเอียดกลุ่ม">
          <Input label="ชื่อกลุ่ม" value={group_name} onChange={setGroupName} placeholder="ตั้งชื่อกลุ่มของคุณ" />
          <Textarea label="คำอธิบายกลุ่ม" value={description} onChange={setDescription} placeholder="อธิบายรายละเอียดหรือเงื่อนไขของกลุ่ม" />
          <div>
            <Input label="วันหมดอายุ" type="datetime-local" value={expire_at} onChange={setExpireAt} />
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">โปรดตั้งวันหมดอายุให้เพียงพอสำหรับผู้เข้าร่วม (เวลาเป็น local)</p>
            </div>
          </div>
        </InputGroup>

        {/* Group 2: Product & Variant Selection */}
        <InputGroup title="2. การเลือกสินค้า">
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div className="flex-1">
              <Select
                label="สินค้า"
                value={selectedProductId ?? ""}
                onChange={(val) => {
                    setSelectedProductId(Number(val));
                    setSelectedVariantId(null);
                }}
                options={products.map(p => ({ value: p.product_id, label: p.product_name ?? "" }))}
                placeholder="เลือกสินค้าที่ต้องการ"
              />
              <div className="flex items-center gap-2 mt-2">
                <Search className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-500">เลือกสินค้าที่คุณต้องการเปิดกลุ่มซื้อร่วม</p>
              </div>
            </div>

            {/* Product Image Preview */}
            <div className="w-28 h-28 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
              {productImage ? (
                <img src={productImage} alt={selectedProduct?.product_name ?? 'product'} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-12 h-12 text-gray-300" />
              )}
            </div>
          </div>

          {/* Variant */}
          {hasVariants && (
            <Select
              label="Variant / ตัวเลือกสินค้า"
              value={selectedVariantId ?? ""}
              onChange={(val) => setSelectedVariantId(Number(val))}
              options={selectedProduct?.product_variants?.map(v => ({
                value: v.variant_id,
                label: `${v.variant_options?.map(vo => `${vo.option_name}: ${vo.value}`).join(", ")} (Stock: ${v.total_stock})`
              })) ?? []}
              placeholder="เลือก Variant ของสินค้า"
              disabled={!selectedProductId}
            />
          )}
        </InputGroup>

        {/* Group 3: Group Parameters & Points */}
        <InputGroup title="3. การตั้งค่ากลุ่ม">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="สมาชิก (คน)" type="number" min={1} value={required_members} onChange={setRequiredMembers} icon={<Users className="w-4 h-4" />} />
            <Input label="สินค้าต่อสมาชิก (ชิ้น)" type="number" min={1} value={items_per_member} onChange={setItemsPerMember} icon={<Package className="w-4 h-4" />} />
            <Input label="สินค้าต่อกลุ่ม (ชิ้น)" type="number" min={1} value={total_items} onChange={() => {}} icon={<Package className="w-4 h-4" />} disabled={true} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>ตัวอย่าง: ถ้า สมาชิก=5 และ สินค้าต่อสมาชิก=2</span>
            <ArrowRight className="w-3 h-3" />
            <span>จำเป็นต้องมีสินค้าทั้งหมด 10 ชิ้น</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="แต้มต่อกลุ่ม (Points)" type="number" min={0} value={points_per_group} onChange={setPointsPerGroup} icon={<Gift className="w-4 h-4" />} />
            <Input label="แต้มต่อสมาชิก (Points)" type="number" min={0} value={points_per_member} onChange={() => {}} icon={<Gift className="w-4 h-4" />} disabled={true} />
          </div>
        </InputGroup>

        {/* Submit Button */}
        <div className="mt-4">
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">สรุปการตั้งค่า</p>
            <div className="mt-2 text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span>สินค้า: <span className="font-medium text-gray-800">{selectedProduct?.product_name ?? '-'}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span>สมาชิกที่ต้องการ: <span className="font-medium">{required_members}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span>สินค้าต่อสมาชิก: <span className="font-medium">{items_per_member}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span>สินค้าทั้งหมดที่ต้องมี: <span className="font-medium">{total_items}</span></span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedProductId || !group_name.trim()}
            className={`w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังสร้าง...</span>
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                <span>สร้าง Group Buying</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Sub Components ---------- */

interface InputGroupProps {
  title: string;
  children: React.ReactNode;
}

function InputGroup({ title, children }: InputGroupProps) {
  return (
    <div className="border border-gray-200 p-4 rounded-xl bg-gray-50 shadow-inner">
      <h3 className="text-lg font-bold mb-4 text-indigo-600">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface InputProps {
  label: string;
  type?: string;
  value: any;
  min?: number;
  placeholder?: string;
  onChange: (val: any) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

function Input({ label, type = "text", value, min, placeholder, onChange, icon, disabled = false }: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      onChange(Number(e.target.value));
    } else {
      onChange(e.target.value);
    }
  }

  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`border border-gray-300 p-3 w-full rounded-lg transition duration-150 ease-in-out 
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400
          disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500`}
      />
    </div>
  );
}

interface TextareaProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
}

function Textarea({ label, value, placeholder, onChange }: TextareaProps) {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
      <textarea 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        rows={3}
        className={`border border-gray-300 p-3 w-full rounded-lg transition duration-150 ease-in-out 
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 resize-none`} 
      />
    </div>
  );
}

interface SelectProps {
  label: string;
  value: any;
  placeholder?: string;
  onChange: (val: any) => void;
  options: { value: any; label: string }[];
  disabled?: boolean;
}

function Select({ label, value, onChange, placeholder, options, disabled = false }: SelectProps) {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <select 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          disabled={disabled}
          className={`border border-gray-300 appearance-none p-3 w-full rounded-lg bg-white pr-10 cursor-pointer 
            transition duration-150 ease-in-out focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed`}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

interface AlertProps {
  message: { text: string, type: 'success' | 'error' };
}

function Alert({ message }: AlertProps) {
  const isSuccess = message.type === 'success';
  const bgColor = isSuccess ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <div className={`mb-4 p-4 rounded-lg border-l-4 ${bgColor} transition-opacity duration-300`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="font-medium text-sm">{message.text}</p>
      </div>
    </div>
  );
}