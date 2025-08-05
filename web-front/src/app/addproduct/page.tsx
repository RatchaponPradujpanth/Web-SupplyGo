'use client';

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { addproduct, getCategories } from '@/service/apis';

interface Category {
  category_id: number;
  category_name: string;
}

export default function AddProductPage() {
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [useVariants, setUseVariants] = useState(false);
  const [options, setOptions] = useState<{ name: string; values: string[] }[]>([
    { name: '', values: [''] },
  ]);
  const [variants, setVariants] = useState<
    {
      sku: string;
      price: number;
      stock_quantity: number;
      option_values: string[];
    }[]
  >([]);

  const [loading, setLoading] = useState(false);

  // โหลดประเภทสินค้า
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('โหลดประเภทสินค้าไม่สำเร็จ', err);
      }
    }
    fetchCategories();
  }, []);

  // จัดการ option name/value
  const handleOptionNameChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].name = value;
    setOptions(newOptions);
  };

  const handleOptionValueChange = (optionIndex: number, valueIndex: number, value: string) => {
    const newOptions = [...options];
    newOptions[optionIndex].values[valueIndex] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { name: '', values: [''] }]);
  };

  const addOptionValue = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values.push('');
    setOptions(newOptions);
  };

  // สร้าง variants จาก options (cartesian product)
  const generateVariants = () => {
    // ฟังก์ชัน cartesian product
    const cartesian = (arrays: string[][]): string[][] =>
      arrays.reduce<string[][]>(
        (acc, curr) =>
          acc.flatMap((a) => curr.map((c) => [...a, c])),
        [[]]
      );

    // เอาเฉพาะ values ที่ไม่ว่างเปล่า
    const filteredValues = options.map((opt) => opt.values.filter((v) => v.trim() !== ''));

    if (filteredValues.some((vals) => vals.length === 0)) {
      toast.error('กรุณากรอกค่าตัวเลือกให้ครบทุก option');
      return;
    }

    const combos = cartesian(filteredValues);

    // สร้าง variants เริ่มต้น
    const newVariants = combos.map((combo) => ({
      sku: '',
      price: 0,
      stock_quantity: 0,
      option_values: combo,
    }));

    setVariants(newVariants);
  };

  // เปลี่ยนข้อมูล variant
  const handleVariantChange = (
    index: number,
    field: 'sku' | 'price' | 'stock_quantity',
    value: string
  ) => {
    const newVariants = [...variants];
    if (field === 'price' || field === 'stock_quantity') {
      // แปลงเป็น number ถ้าไม่ใช่เลข ให้เป็น 0
      const numValue = Number(value);
      newVariants[index][field] = isNaN(numValue) ? 0 : numValue;
    } else {
      newVariants[index][field] = value;
    }
    setVariants(newVariants);
  };

  // ส่งข้อมูลไป api
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !categoryId) {
      toast.error('กรุณากรอกชื่อสินค้าและประเภทสินค้า');
      return;
    }

    if (!useVariants && (price === '' || price < 0)) {
      toast.error('กรุณากรอกราคาสินค้า');
      return;
    }

    if (useVariants) {
      // เช็ค variants ว่าราคาหรือจำนวนติดลบไหม
      for (const v of variants) {
        if (v.price < 0 || v.stock_quantity < 0) {
          toast.error('ราคาหรือจำนวนคงเหลือของ Variant ต้องไม่ติดลบ');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token') || '';
      await addproduct(
        token,
        productName,
        productDescription,
        useVariants ? 0 : Number(price),
        Number(categoryId),
        imageFiles,
        useVariants ? options : [],
        useVariants ? variants : []
      );

      toast.success('เพิ่มสินค้าสำเร็จ');

      // reset form
      setProductName('');
      setProductDescription('');
      setPrice('');
      setCategoryId('');
      setImageFiles([]);
      setOptions([{ name: '', values: [''] }]);
      setVariants([]);
      setUseVariants(false);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-md mt-10">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold mb-6">เพิ่มสินค้าใหม่</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useVariants}
            onChange={(e) => setUseVariants(e.target.checked)}
          />
          ใช้ตัวเลือกย่อย (Variants)
        </label>

        {/* ชื่อสินค้า */}
        <input
          type="text"
          placeholder="ชื่อสินค้า"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />

        {/* คำอธิบาย */}
        <textarea
          placeholder="คำอธิบาย"
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />

        {/* ราคา ถ้าไม่ใช้ variant */}
        {!useVariants && (
          <input
            type="number"
            placeholder="ราคาสินค้า"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
            required
          />
        )}

        {/* ประเภทสินค้า */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">-- เลือกประเภทสินค้า --</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.category_name}
            </option>
          ))}
        </select>

        {/* อัปโหลดรูปหลายไฟล์ */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
          className="w-full"
          required
        />
        <div className="flex flex-wrap gap-2">
          {imageFiles.map((file, i) => {
            const url = URL.createObjectURL(file);
            return (
              <img
                key={i}
                src={url}
                alt={`preview-${i}`}
                className="w-20 h-20 object-cover border rounded"
                onLoad={() => URL.revokeObjectURL(url)}
              />
            );
          })}
        </div>

        {/* ตัวเลือกและ variants */}
        {useVariants && (
          <>
            <div>
              <h3 className="font-semibold mb-2">ตั้งค่าคุณลักษณะ (Options)</h3>
              {options.map((opt, i) => (
                <div key={i} className="mb-4 border p-2 rounded">
                  <input
                    type="text"
                    placeholder="ชื่อคุณลักษณะ เช่น สี, ขนาด"
                    value={opt.name}
                    onChange={(e) => handleOptionNameChange(i, e.target.value)}
                    className="w-full mb-2 px-2 py-1 border rounded"
                    required
                  />
                  {opt.values.map((val, j) => (
                    <input
                      key={j}
                      type="text"
                      placeholder={`ค่า ${j + 1}`}
                      value={val}
                      onChange={(e) => handleOptionValueChange(i, j, e.target.value)}
                      className="w-full mb-1 px-2 py-1 border rounded"
                      required
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => addOptionValue(i)}
                    className="text-blue-600 text-sm"
                  >
                    + เพิ่มค่า
                  </button>
                </div>
              ))}
              <button type="button" onClick={addOption} className="text-green-600 text-sm">
                + เพิ่มคุณลักษณะใหม่
              </button>

              <button
                type="button"
                onClick={generateVariants}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded"
              >
                สร้างตัวเลือกย่อย (Variants)
              </button>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">ตัวเลือกย่อย (Variants)</h3>
              {variants.length === 0 && <p className="text-gray-500">ยังไม่มีตัวเลือกย่อย</p>}
              {variants.map((variant, vi) => (
                <div key={vi} className="border rounded p-2 mb-2">
                  <div>ค่าตัวเลือก: {variant.option_values.join(', ')}</div>
                  <input
                    type="text"
                    placeholder="SKU"
                    value={variant.sku}
                    onChange={(e) => handleVariantChange(vi, 'sku', e.target.value)}
                    className="w-full mb-1 px-2 py-1 border rounded"
                    required
                  />
                  <input
                    type="number"
                    placeholder="ราคา"
                    min={0}
                    step={0.01}
                    value={variant.price}
                    onChange={(e) => handleVariantChange(vi, 'price', e.target.value)}
                    className="w-full mb-1 px-2 py-1 border rounded"
                    required
                  />
                  <input
                    type="number"
                    placeholder="จำนวนคงเหลือ"
                    min={0}
                    step={1}
                    value={variant.stock_quantity}
                    onChange={(e) => handleVariantChange(vi, 'stock_quantity', e.target.value)}
                    className="w-full mb-1 px-2 py-1 border rounded"
                    required
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded"
        >
          {loading ? 'กำลังบันทึก...' : 'เพิ่มสินค้า'}
        </button>
      </form>
    </div>
  );
}
