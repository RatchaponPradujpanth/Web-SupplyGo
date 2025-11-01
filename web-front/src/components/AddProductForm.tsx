"use client";

import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { addproduct } from "@/service/apis";
import { getCategories } from "@/service/api/category";
import NumericInput from "@/components/ui/NumericInput";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Package,
  DollarSign,
  Layers,
  Box,
  Loader2,
  CheckCircle,
  Trash2,
  ImagePlus,
} from "lucide-react";

interface Category {
  category_id: number;
  category_name: string;
}

interface AddProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddProductForm({ onSuccess, onCancel }: AddProductFormProps) {
  const [step, setStep] = useState(1);

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [useVariants, setUseVariants] = useState(false);
  const [options, setOptions] = useState<{ name: string; values: string[] }[]>([{ name: "", values: [""] }]);
  const [variants, setVariants] = useState<
    { sku: string; price: number; stock_quantity: number; option_values: string[] }[]
  >([]);
  const [batches, setBatches] = useState<
    { batch_number: string; manufactured_date: string; expiry_date: string; quantity: string }[][]
  >([]);
  const [simpleBatches, setSimpleBatches] = useState<
    { batch_number: string; manufactured_date: string; expiry_date: string; quantity: string }[]
  >([{ batch_number: "", manufactured_date: "", expiry_date: "", quantity: "" }]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("โหลดประเภทสินค้าไม่สำเร็จ", err);
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
  const addOption = () => setOptions([...options, { name: "", values: [""] }]);
  const addOptionValue = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values.push("");
    setOptions(newOptions);
  };

  const generateVariants = () => {
    const cartesian = (arrays: string[][]): string[][] =>
      arrays.reduce<string[][]>((acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])), [[]]);

    const filteredValues = options.map((opt) => opt.values.filter((v) => v.trim() !== ""));
    if (filteredValues.some((vals) => vals.length === 0)) {
      toast.error("⚠️ กรุณากรอกค่าตัวเลือกให้ครบทุก option");
      return;
    }

    const combos = cartesian(filteredValues);
    const newVariants = combos.map((combo) => ({ sku: "", price: 0, stock_quantity: 0, option_values: combo }));

    setVariants(newVariants);
    setBatches(combos.map(() => [{ batch_number: "", manufactured_date: "", expiry_date: "", quantity: "" }]));
    toast.success(`✅ สร้าง ${newVariants.length} ตัวเลือกสำเร็จ!`);
  };

  const handleVariantChange = (index: number, field: "sku" | "price" | "stock_quantity", value: string) => {
    const newVariants = [...variants];
    if (field === "price" || field === "stock_quantity") {
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
    setSimpleBatches([...simpleBatches, { batch_number: "", manufactured_date: "", expiry_date: "", quantity: "" }]);
  };
  const removeSimpleBatch = (index: number) => {
    if (simpleBatches.length > 1) {
      const newBatches = simpleBatches.filter((_, i) => i !== index);
      setSimpleBatches(newBatches);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !categoryId) return toast.error("กรุณากรอกชื่อสินค้าและประเภทสินค้า");
    if (!useVariants && (price === "" || price < 0)) return toast.error("กรุณากรอกราคาสินค้า");

    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
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

      toast.success("เพิ่มสินค้าสำเร็จ 🎉");
      if (onSuccess) onSuccess();
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-12 w-full max-w-5xl mx-auto mt-10 bg-white rounded-2xl shadow-lg border border-gray-100">
      <Toaster position="top-right" />
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-blue-700 flex justify-center items-center gap-2">
        <ShoppingBag className="w-7 h-7" /> เพิ่มสินค้าใหม่
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h3 className="font-semibold mb-2 text-lg sm:text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" /> ขั้นตอนที่ 1: ข้อมูลทั่วไป
            </h3>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={useVariants} onChange={(e) => setUseVariants(e.target.checked)} />
              <Layers className="w-4 h-4 text-gray-600" /> ใช้ตัวเลือกย่อย (Variants)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="ชื่อสินค้า"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
                className="border rounded px-3 py-2 w-full"
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
              <NumericInput
                placeholder="ราคาสินค้า"
                min={0}
                value={price}
                onChange={(val) => setPrice(val === "" ? "" : Number(val))}
                className="mt-3"
                inputClassName="border rounded px-3 py-2 w-full"
              />
            )}

            <textarea
              placeholder="คำอธิบายสินค้า"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="border rounded px-3 py-2 w-full mt-3"
              rows={3}
            />

            <div className="flex justify-between mt-4">
              {onCancel && (
                <button type="button" onClick={onCancel} className="text-gray-600 hover:text-gray-800 flex items-center gap-1">
                  <X className="w-4 h-4" /> ยกเลิก
                </button>
              )}
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-auto flex items-center gap-1"
              >
                ถัดไป <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h3 className="font-semibold mb-2 text-lg sm:text-xl flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-blue-600" /> ขั้นตอนที่ 2: รูปภาพสินค้า
            </h3>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              className="w-full border rounded p-2"
              required
            />
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(1)} type="button" className="text-gray-600 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> กลับ
              </button>
              <button
                onClick={() => setStep(useVariants ? 3 : 4)}
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
              >
                ถัดไป <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h3 className="font-semibold mb-3 text-lg sm:text-xl flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> ขั้นตอนที่ 3: ตั้งค่าตัวเลือกสินค้า (Variants)
            </h3>
            {options.map((opt, i) => (
              <div key={i} className="border p-3 rounded mb-3 bg-gray-50">
                <input
                  type="text"
                  placeholder="ชื่อ option (เช่น สี, ขนาด)"
                  value={opt.name}
                  onChange={(e) => handleOptionNameChange(i, e.target.value)}
                  className="border rounded px-3 py-2 w-full mb-2"
                />
                {opt.values.map((val, j) => (
                  <input
                    key={j}
                    type="text"
                    placeholder={`ค่า ${j + 1}`}
                    value={val}
                    onChange={(e) => handleOptionValueChange(i, j, e.target.value)}
                    className="border rounded px-3 py-2 w-full mb-2"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addOptionValue(i)}
                  className="text-blue-600 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> เพิ่มค่า
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 mt-2">
              <button type="button" onClick={addOption} className="text-blue-600 flex items-center gap-1">
                <Plus className="w-4 h-4" /> เพิ่ม Option
              </button>
              <button
                type="button"
                onClick={generateVariants}
                className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" /> สร้าง Variants
              </button>
            </div>

            {variants.length > 0 && (
              <div className="mt-4 space-y-3">
                {variants.map((v, i) => (
                  <div key={i} className="border rounded p-3 bg-white">
                    <p className="font-medium text-gray-700 flex items-center gap-2">
                      <Box className="w-4 h-4 text-blue-600" /> {v.option_values.join(" / ")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                      <input
                        type="text"
                        placeholder="SKU"
                        value={v.sku}
                        onChange={(e) => handleVariantChange(i, "sku", e.target.value)}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="ราคา"
                        value={v.price}
                        onChange={(e) => handleVariantChange(i, "price", e.target.value)}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="จำนวนคงเหลือ"
                        value={v.stock_quantity}
                        onChange={(e) => handleVariantChange(i, "stock_quantity", e.target.value)}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(2)} type="button" className="text-gray-600 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> กลับ
              </button>
              <button
                onClick={() => setStep(4)}
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
              >
                ถัดไป <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h3 className="font-semibold mb-2 text-lg sm:text-xl flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" /> ขั้นตอนที่ 4: ข้อมูลล็อตสินค้า (Batch)
            </h3>

            {useVariants ? (
              <p className="text-gray-600 mb-2 text-sm">
                ระบุล็อตสินค้าแยกตามแต่ละ Variant
              </p>
            ) : (
              <p className="text-gray-600 mb-2 text-sm">
                ระบุล็อตสินค้าสำหรับสินค้าทั่วไป
              </p>
            )}

            {simpleBatches.map((batch, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="หมายเลขล็อต"
                  value={batch.batch_number}
                  onChange={(e) => handleSimpleBatchChange(i, "batch_number", e.target.value)}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="date"
                  placeholder="วันที่ผลิต"
                  value={batch.manufactured_date}
                  onChange={(e) => handleSimpleBatchChange(i, "manufactured_date", e.target.value)}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="date"
                  placeholder="วันหมดอายุ"
                  value={batch.expiry_date}
                  onChange={(e) => handleSimpleBatchChange(i, "expiry_date", e.target.value)}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="จำนวน"
                  value={batch.quantity}
                  onChange={(e) => handleSimpleBatchChange(i, "quantity", e.target.value)}
                  className="border rounded px-3 py-2"
                />
              </div>
            ))}

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={addSimpleBatch}
                className="text-blue-600 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> เพิ่มล็อตสินค้า
              </button>
              {simpleBatches.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSimpleBatch(simpleBatches.length - 1)}
                  className="text-red-500 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> ลบล็อตล่าสุด
                </button>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(useVariants ? 3 : 2)} type="button" className="text-gray-600 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> กลับ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                บันทึกสินค้า
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
