'use client';
import { useState } from 'react';
import { addproduct } from '@/service/apis';
import { API_URL } from '@/service/apis';

export default function UploadPage() {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [options, setOptions] = useState([
    { name: '', values: '' } // values เป็น string แยกด้วย , (comma)
  ]);

  const [variants, setVariants] = useState([
    {
      sku: '',
      price: 0,
      stock_quantity: 0,
      option_values: '' // แยกด้วย comma เช่น "แดง,S"
    }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      alert('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');
      return;
    }

    const formattedOptions = options.map((opt) => ({
      name: opt.name,
      values: opt.values.split(',').map((v) => v.trim())
    }));

    const formattedVariants = variants.map((v) => ({
      sku: v.sku,
      price: v.price,
      stock_quantity: v.stock_quantity,
      option_values: v.option_values.split(',').map((val) => val.trim())
    }));

    try {
      setUploading(true);
      await addproduct(
        localStorage.getItem("token") || '', // ใส่ token ของคุณ
        productName,
        description,
        price,
        categoryId,
        images,
        formattedOptions,
        formattedVariants
      );
      alert('✅ เพิ่มสินค้าสำเร็จ');
    } catch (error) {
      console.error("❌ error:", error);
      alert("❌ เพิ่มสินค้าไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border space-y-6">
      <h1 className="text-2xl font-bold text-center">เพิ่มสินค้า</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="ชื่อสินค้า"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="input w-full"
          required
        />
        <textarea
          placeholder="รายละเอียดสินค้า"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input w-full"
          required
        />
        <input
          type="number"
          placeholder="ราคา"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value))}
          className="input w-full"
          required
        />
        <input
          type="number"
          placeholder="หมวดหมู่ (category_id)"
          value={categoryId}
          onChange={(e) => setCategoryId(parseInt(e.target.value))}
          className="input w-full"
          required
        />
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImages(Array.from(e.target.files || []))}
          className="w-full border px-4 py-2 rounded-lg"
        />

        {/* Product Options */}
        <div>
          <h2 className="text-lg font-semibold mt-4">ตัวเลือกสินค้า (Options)</h2>
          {options.map((opt, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 my-2">
              <input
                type="text"
                placeholder="เช่น สี"
                value={opt.name}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((o, i) =>
                      i === index ? { ...o, name: e.target.value } : o
                    )
                  )
                }
                className="input"
              />
              <input
                type="text"
                placeholder="เช่น แดง,น้ำเงิน"
                value={opt.values}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((o, i) =>
                      i === index ? { ...o, values: e.target.value } : o
                    )
                  )
                }
                className="input"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOptions([...options, { name: '', values: '' }])}
            className="text-blue-600 text-sm"
          >
            + เพิ่ม Option
          </button>
        </div>

        {/* Product Variants */}
        <div>
          <h2 className="text-lg font-semibold mt-4">ตัวแปรสินค้า (Variants)</h2>
          {variants.map((v, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 my-2">
              <input
                type="text"
                placeholder="SKU"
                value={v.sku}
                onChange={(e) =>
                  setVariants((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, sku: e.target.value } : item
                    )
                  )
                }
                className="input"
              />
              <input
                type="number"
                placeholder="ราคา"
                value={v.price}
                onChange={(e) =>
                  setVariants((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, price: parseFloat(e.target.value) } : item
                    )
                  )
                }
                className="input"
              />
              <input
                type="number"
                placeholder="จำนวน"
                value={v.stock_quantity}
                onChange={(e) =>
                  setVariants((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, stock_quantity: parseInt(e.target.value) } : item
                    )
                  )
                }
                className="input"
              />
              <input
                type="text"
                placeholder="เช่น แดง,S"
                value={v.option_values}
                onChange={(e) =>
                  setVariants((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, option_values: e.target.value } : item
                    )
                  )
                }
                className="input"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setVariants([...variants, { sku: '', price: 0, stock_quantity: 0, option_values: '' }])
            }
            className="text-blue-600 text-sm"
          >
            + เพิ่ม Variant
          </button>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700 transition disabled:opacity-50"
        >
          {uploading ? 'กำลังอัปโหลด...' : 'เพิ่มสินค้า'}
        </button>
      </form>
    </div>
  );
}
