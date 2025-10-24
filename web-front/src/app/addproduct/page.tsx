'use client';

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { addproduct } from '@/service/apis';
import { getCategories } from '@/service/api/category';
import { useRouter } from 'next/navigation';

interface Category {
  category_id: number;
  category_name: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [useVariants, setUseVariants] = useState(false);
  const [options, setOptions] = useState<{ name: string; values: string[] }[]>([{ name: '', values: [''] }]);
  const [variants, setVariants] = useState<
    { sku: string; price: number; stock_quantity: number; option_values: string[] }[]
  >([]);
  const [batches, setBatches] = useState<
    { batch_number: string; manufactured_date: string; expiry_date: string; quantity: string }[][]
  >([]);
  const [simpleBatches, setSimpleBatches] = useState<
    { batch_number: string; manufactured_date: string; expiry_date: string; quantity: string }[]
  >([{ batch_number: '', manufactured_date: '', expiry_date: '', quantity: '' }]);

  const [loading, setLoading] = useState(false);

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
  const addOption = () => setOptions([...options, { name: '', values: [''] }]);
  const addOptionValue = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values.push('');
    setOptions(newOptions);
  };

  const generateVariants = () => {
    console.log('🔍 Options before filtering:', options);
    
    const cartesian = (arrays: string[][]): string[][] =>
      arrays.reduce<string[][]>((acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])), [[]]);

    // กรอง values ที่ไม่ว่างเปล่า
    const filteredValues = options.map((opt) => opt.values.filter((v) => v.trim() !== ''));
    console.log('🔍 Filtered values:', filteredValues);
    
    // เช็คว่ามี option ไหนที่ไม่มี value เลย
    if (filteredValues.some((vals) => vals.length === 0)) {
      toast.error('❌ กรุณากรอกค่าตัวเลือกให้ครบทุก option (เช่น กรอก "แดง", "น้ำเงิน")');
      return;
    }

    const combos = cartesian(filteredValues);
    console.log('✅ Generated combinations:', combos);
    
    const newVariants = combos.map((combo) => ({ sku: '', price: 0, stock_quantity: 0, option_values: combo }));
    console.log('✅ Generated variants:', newVariants);
    
    setVariants(newVariants);
    setBatches(combos.map(() => [{ batch_number: '', manufactured_date: '', expiry_date: '', quantity: '' }]));
    
    toast.success(`✅ สร้าง ${newVariants.length} ตัวเลือกสำเร็จ!`);
  };

  const handleVariantChange = (index: number, field: 'sku' | 'price' | 'stock_quantity', value: string) => {
    const newVariants = [...variants];
    if (field === 'price' || field === 'stock_quantity') {
      const numValue = Number(value);
      newVariants[index][field] = isNaN(numValue) ? 0 : numValue;
    } else {
      newVariants[index][field] = value;
    }
    setVariants(newVariants);
  };

  const handleSimpleBatchChange = (index: number, field: keyof typeof simpleBatches[0], value: string) => {
    const newBatches = [...simpleBatches];
    newBatches[index][field] = value;
    setSimpleBatches(newBatches);
  };
  const addSimpleBatch = () => {
    setSimpleBatches([...simpleBatches, { batch_number: '', manufactured_date: '', expiry_date: '', quantity: '' }]);
  };
  const removeSimpleBatch = (index: number) => {
    if (simpleBatches.length > 1) {
      const newBatches = simpleBatches.filter((_, i) => i !== index);
      setSimpleBatches(newBatches);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !categoryId) return toast.error('กรุณากรอกชื่อสินค้าและประเภทสินค้า');
    if (!useVariants && (price === '' || price < 0)) return toast.error('กรุณากรอกราคาสินค้า');
    if (useVariants) {
      for (const v of variants) {
        if (v.price < 0 || v.stock_quantity < 0) return toast.error('ราคาหรือจำนวนคงเหลือต้องไม่ติดลบ');
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const batchesToSend = useVariants ? batches : [simpleBatches];

      await addproduct(
        token,
        productName,
        productDescription,
        useVariants ? 0 : Number(price),
        Number(categoryId),
        imageFiles,
        useVariants ? options : [],
        useVariants ? variants : [],
        batchesToSend
      );

      toast.success('เพิ่มสินค้าสำเร็จ');
      router.push('/dashboard/products');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white rounded-xl shadow-lg p-6">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">เพิ่มสินค้าใหม่ 🛍️</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div>
            <h3 className="font-semibold mb-2 text-lg">ขั้นตอนที่ 1: ข้อมูลทั่วไป</h3>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={useVariants} onChange={(e) => setUseVariants(e.target.checked)} />
              ใช้ตัวเลือกย่อย (Variants)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="ชื่อสินค้า"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                className="border rounded px-3 py-2"
                required
              >
                <option value="">-- เลือกประเภทสินค้า --</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            {!useVariants && (
              <input
                type="number"
                placeholder="ราคาสินค้า"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="border rounded px-3 py-2 w-full mt-3"
                required
              />
            )}

            <textarea
              placeholder="คำอธิบายสินค้า"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="border rounded px-3 py-2 w-full mt-3"
              rows={3}
            />

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                ถัดไป ➡️
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Images */}
        {step === 2 && (
          <div>
            <h3 className="font-semibold mb-2 text-lg">ขั้นตอนที่ 2: รูปภาพสินค้า</h3>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              className="w-full"
              required
            />
            <div className="mt-3 grid grid-cols-3 gap-3">
              {imageFiles.map((file, i) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={i} className="relative">
                    <img src={url} alt={`preview-${i}`} className="w-full h-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => setImageFiles(imageFiles.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(1)} type="button" className="text-gray-600">
                ⬅️ กลับ
              </button>
              <button onClick={() => setStep(useVariants ? 3 : 4)} type="button" className="bg-blue-600 text-white px-4 py-2 rounded">
                ถัดไป ➡️
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Variants */}
        {step === 3 && useVariants && (
          <div>
            <h3 className="font-semibold mb-3 text-lg">ขั้นตอนที่ 3: ตั้งค่าตัวเลือก (Variants)</h3>
            {options.map((opt, i) => (
              <div key={i} className="border p-3 rounded mb-3 bg-gray-50">
                <input
                  type="text"
                  placeholder="ชื่อคุณลักษณะ เช่น สี, ขนาด"
                  value={opt.name}
                  onChange={(e) => handleOptionNameChange(i, e.target.value)}
                  className="w-full mb-2 border rounded px-2 py-1"
                />
                {opt.values.map((val, j) => (
                  <input
                    key={j}
                    type="text"
                    placeholder={`ค่า ${j + 1}`}
                    value={val}
                    onChange={(e) => handleOptionValueChange(i, j, e.target.value)}
                    className="w-full mb-1 border rounded px-2 py-1"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addOptionValue(i)}
                  className="text-blue-600 text-sm mt-1"
                >
                  + เพิ่มค่า
                </button>
              </div>
            ))}
            <button type="button" onClick={addOption} className="text-green-600 text-sm mb-3">
              + เพิ่มคุณลักษณะใหม่
            </button>

            <button
              type="button"
              onClick={generateVariants}
              className="block bg-indigo-600 text-white px-4 py-2 rounded mb-4"
            >
              สร้างตัวเลือกย่อย (Variants)
            </button>

            {variants.length > 0 && (
              <div className="space-y-4">
                {variants.map((variant, vi) => (
                  <div key={vi} className="border p-3 rounded">
                    <div className="font-medium mb-2">{variant.option_values.join(', ')}</div>
                    <input
                      type="text"
                      placeholder="SKU"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(vi, 'sku', e.target.value)}
                      className="border rounded w-full mb-2 px-2 py-1"
                    />
                    <div className="grid grid-cols-2 gap-2">
  <div className="col-span-1">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      ราคา
    </label>
    <input
      type="number"
      placeholder="ราคา"
      min={0}
      step={0.01}
      value={variant.price}
      onChange={(e) => handleVariantChange(vi, 'price', e.target.value)}
      className="w-full border rounded px-2 py-1"
      required
    />
  </div>

  <div className="col-span-1">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      จำนวนคงเหลือ
    </label>
    <input
      type="number"
      placeholder="จำนวนคงเหลือ"
      min={0}
      step={1}
      value={variant.stock_quantity}
      onChange={(e) => handleVariantChange(vi, 'stock_quantity', e.target.value)}
      className="w-full border rounded px-2 py-1"
      required
    />
  </div>
</div>

                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(2)} type="button" className="text-gray-600">
                ⬅️ กลับ
              </button>
              <button onClick={() => setStep(4)} type="button" className="bg-blue-600 text-white px-4 py-2 rounded">
                ถัดไป ➡️
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Batches */}
        {step === 4 && (
          <div>
            <h3 className="font-semibold mb-2 text-lg">ขั้นตอนที่ 4: ข้อมูล Batch</h3>
            {!useVariants ? (
              <>
                {simpleBatches.map((batch, i) => (
                  <div key={i} className="border p-3 rounded mb-3">
                    <input
                      type="text"
                      placeholder="เลขล็อต"
                      value={batch.batch_number}
                      onChange={(e) => handleSimpleBatchChange(i, 'batch_number', e.target.value)}
                      className="border rounded px-2 py-1 w-full mb-1"
                    />
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <input
                        type="date"
                        value={batch.manufactured_date}
                        onChange={(e) => handleSimpleBatchChange(i, 'manufactured_date', e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        type="date"
                        value={batch.expiry_date}
                        onChange={(e) => handleSimpleBatchChange(i, 'expiry_date', e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    </div>
                    <input
                      type="number"
                      placeholder="จำนวน"
                      value={batch.quantity}
                      onChange={(e) => handleSimpleBatchChange(i, 'quantity', e.target.value)}
                      className="border rounded px-2 py-1 w-full mb-1"
                    />
                    {simpleBatches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSimpleBatch(i)}
                        className="text-red-600 text-sm"
                      >
                        ลบ Batch นี้
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSimpleBatch}
                  className="text-green-600 text-sm mb-4"
                >
                  + เพิ่ม Batch
                </button>
              </>
            ) : (
              <p className="text-gray-500">Batch สำหรับแต่ละ Variant จะถูกบันทึกในขั้นตอน Variant</p>
            )}

            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(useVariants ? 3 : 2)} type="button" className="text-gray-600">
                ⬅️ กลับ
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded font-semibold ${
                  loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? '⏳ กำลังบันทึก...' : '✅ เพิ่มสินค้า'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
