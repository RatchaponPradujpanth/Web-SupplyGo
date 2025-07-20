'use client';

import React, { useState, useEffect } from 'react';
import { addproduct } from '@/service/apis'; // ฟังก์ชันเพิ่มสินค้า
import { useRouter } from 'next/navigation';
import { getCategories } from '@/service/apis';

type Category = {
  category_id: number;
  category_name: string;
};

export default function AddProductForm() {
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // โหลดประเภทสินค้าจาก API (สมมติมี API /api/categories)
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories()
        setCategories(data);
      } catch (error) {
        console.error('โหลดประเภทสินค้าไม่สำเร็จ', error);
      }
    }
    fetchCategories();
  }, []);

  // แสดง preview รูปเมื่อเลือกไฟล์ใหม่
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  // handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !price || !categoryId || !imageFile) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนและเลือกภาพสินค้า');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      await addproduct(token, productName, productDescription, Number(price), Number(categoryId), imageFile);
      alert('เพิ่มสินค้าสำเร็จ');
      router.push('/dashboard'); // หรือหน้าอื่นๆที่ต้องการไป
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-6">เพิ่มสินค้าใหม่</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ชื่อสินค้า */}
        <div>
          <label htmlFor="productName" className="block font-semibold mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
          <input
            id="productName"
            type="text"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ระบุชื่อสินค้า"
            required
          />
        </div>

        {/* คำอธิบาย */}
        <div>
          <label htmlFor="productDescription" className="block font-semibold mb-1">คำอธิบายสินค้า</label>
          <textarea
            id="productDescription"
            value={productDescription}
            onChange={e => setProductDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="รายละเอียดสินค้า"
            rows={4}
          />
        </div>

        {/* ราคา */}
        <div>
          <label htmlFor="price" className="block font-semibold mb-1">ราคา (บาท) <span className="text-red-500">*</span></label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ระบุราคา"
            required
          />
        </div>

        {/* ประเภทสินค้า */}
        <div>
          <label htmlFor="category" className="block font-semibold mb-1">ประเภทสินค้า <span className="text-red-500">*</span></label>
          <select
            id="category"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- เลือกประเภทสินค้า --</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
            ))}
          </select>
        </div>

        {/* อัปโหลดรูป */}
        <div>
          <label className="block font-semibold mb-1">รูปสินค้า <span className="text-red-500">*</span></label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setImageFile(e.target.files?.[0] || null)}
            required
            className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            "
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-3 max-w-xs rounded border"
            />
          )}
        </div>

        {/* ปุ่มบันทึก */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition disabled:opacity-50"
        >
          {loading ? 'กำลังบันทึก...' : 'เพิ่มสินค้า'}
        </button>
      </form>
    </div>
  );
}
