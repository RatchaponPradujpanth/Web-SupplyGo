'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadUsername, fetchUserRole } from '@/service/apis';
import { loaduserproduct } from '@/service/api/loaduserproduct';
import { addtocart } from '@/service/api/addtocart';
import type { Product } from '@/types/type';

export default function UserDashboardPage() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});

  const router = useRouter();

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return 'ติดต่อร้านค้า';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // ฟังก์ชัน helper แสดงราคาช่วง
  const getDisplayPrice = (product: Product, variantId?: number | null) => {
    if (product.product_variants && product.product_variants.length > 0) {
      if (variantId) {
        const selectedVariant = product.product_variants.find(v => v.variant_id === variantId);
        return formatPrice(selectedVariant?.price);
      } else {
        const prices = product.product_variants
          .map(v => v.price)
          .filter((p): p is number => p !== null);
        if (prices.length === 0) return 'ติดต่อร้านค้า';
        if (prices.length === 1) return formatPrice(prices[0]);
        return `${formatPrice(Math.min(...prices))} - ${formatPrice(Math.max(...prices))}`;
      }
    } else {
      return formatPrice(product.price);
    }
  };

  // load data
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const userRole = await fetchUserRole(token);
        setRole(userRole);

        if (userRole === 'store') {
          router.push('/dashboard');
          return;
        }

        const name = await loadUsername(token);
        setUsername(name);

        const userProducts = await loaduserproduct();
        setProducts(userProducts);
      } catch (err) {
        console.error('🚫 Error loading user dashboard:', err);
        router.push('/');
      }
    };

    loadData();
  }, [router]);

  useEffect(() => {
    if (selectedProduct?.product_images?.length) {
      setMainImage(selectedProduct.product_images[0].image_url);
    } else {
      setMainImage(null);
    }
    setSelectedVariantId(null);
    setSelectedOptions({});
    setQuantity(1);
  }, [selectedProduct]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    const product_id = selectedProduct.product_id;
    const variant_id = selectedVariantId || undefined;

    let option_value_id;
    if (variant_id) {
      const selectedVariant = selectedProduct.product_variants?.find(
        v => v.variant_id === variant_id
      );
      option_value_id = selectedVariant?.variant_options?.map(vo => vo.variant_option_id);
    }

    console.log("🚀 เพิ่มสินค้าลงตะกร้า:", { product_id, quantity, variant_id, option_value_id });

    try {
      await addtocart(product_id, quantity, variant_id, option_value_id);
      alert('✅ เพิ่มสินค้าลงตะกร้าแล้ว');
      setSelectedProduct(null);
      setSelectedVariantId(null);
      setSelectedOptions({});
      setQuantity(1);
    } catch (error) {
      console.error("❌ ไม่สามารถเพิ่มสินค้าลงตะกร้าได้:", error);
      alert('เกิดข้อผิดพลาดขณะเพิ่มสินค้า');
    }
  };

  const renderVariantSelector = () => {
    if (!selectedProduct || !selectedProduct.product_variants?.length) return null;

    return (
      <div className="mt-4">
        <label htmlFor="variant-select" className="font-semibold block mb-1">
          เลือกตัวเลือก (Variant):
        </label>
        <select
          id="variant-select"
          className="w-full p-2 border rounded"
          value={selectedVariantId ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            const variantId = val ? Number(val) : null;
            setSelectedVariantId(variantId);
            if (variantId && selectedProduct.product_variants) {
              const selectedVariant = selectedProduct.product_variants.find(v => v.variant_id === variantId);
              console.log('🚩 เลือก variant_id:', variantId, selectedVariant?.variant_options);
            }
          }}
        >
          <option value="">-- เลือกตัวเลือก --</option>
          {selectedProduct.product_variants.map((v) => (
            <option key={v.variant_id} value={v.variant_id}>
              {v.sku} — {formatPrice(v.price)} — สต็อก: {v.stock_quantity ?? '-'}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderOptionSelectors = () => {
    if (!selectedProduct || !selectedProduct.product_options?.length) return null;

    return selectedProduct.product_options.map((option) => (
      <div key={option.option_id} className="mt-4">
        <label className="font-semibold block mb-1">{option.name}</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedOptions[option.option_id] || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              setSelectedOptions(prev => ({ ...prev, [option.option_id]: Number(val) }));
            } else {
              setSelectedOptions(prev => {
                const newOptions = { ...prev };
                delete newOptions[option.option_id];
                return newOptions;
              });
            }
          }}
        >
          <option value="">-- เลือก {option.name} --</option>
          {option.variant_options.map((vo) => (
            <option key={vo.variant_option_id} value={vo.variant_option_id.toString()}>
              {vo.value}
            </option>
          ))}
        </select>
      </div>
    ));
  };

  const canAddToCart = () => {
    if (!selectedProduct) return false;
    if (selectedProduct.product_variants?.length && !selectedVariantId) return false;
    if (selectedProduct.product_options?.length && Object.keys(selectedOptions).length < selectedProduct.product_options.length) return false;
    return true;
  };

  // ----- Detail Page -----
  if (selectedProduct) {
    const displayPrice = getDisplayPrice(selectedProduct, selectedVariantId);

    return (
      <div className="min-h-screen flex flex-col items-center p-6 bg-gradient-to-br from-green-400 to-blue-600 text-white">
        <button
          onClick={() => {
            setSelectedProduct(null);
            setSelectedVariantId(null);
            setSelectedOptions({});
            setQuantity(1);
          }}
          className="self-start mb-6 bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded shadow"
        >
          ← กลับไปยังรายการสินค้า
        </button>

        <div className="bg-white bg-opacity-90 text-black rounded-lg p-6 max-w-4xl w-full shadow-lg flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex justify-center items-center">
            {mainImage ? (
              <img
                src={mainImage}
                alt="Main product"
                className="w-full max-w-md h-96 object-cover rounded-lg border shadow-md"
              />
            ) : (
              <div className="w-full max-w-md h-96 bg-gray-200 flex items-center justify-center rounded text-gray-500">
                ไม่มีรูปภาพ
              </div>
            )}
          </div>

          <div className="flex flex-col w-1/2">
            <h2 className="text-3xl font-bold mb-2">{selectedProduct.product_name}</h2>
            <p className="mb-4 italic text-gray-700">{selectedProduct.product_description}</p>

            <p className="text-xl font-semibold text-green-700 mb-4">
              ราคา: {displayPrice}
            </p>

            {renderVariantSelector()}
            {renderOptionSelectors()}

            <div className="mt-4">
              <label htmlFor="quantity" className="font-semibold block mb-1">
                จำนวน:
              </label>
              <input
                type="number"
                id="quantity"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-20 p-2 border rounded"
              />
            </div>

            {Object.keys(selectedOptions).length > 0 && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-black">
                <strong>ตัวเลือกที่เลือก:</strong>
                <pre>{JSON.stringify(selectedOptions, null, 2)}</pre>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              className={`font-semibold rounded-lg px-6 py-3 shadow mt-4 ${
                canAddToCart()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-400 text-gray-700 cursor-not-allowed'
              }`}
              disabled={!canAddToCart()}
            >
              ➕ เพิ่มลงตะกร้า
            </button>

            {!canAddToCart() && (
              <p className="text-red-600 text-sm mt-2">
                กรุณาเลือกตัวเลือกให้ครบถ้วน
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----- Dashboard / Product List Page -----
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-400 to-blue-600 text-white p-6">
      <h1 className="text-4xl font-bold mb-4">Hello User 👤</h1>
      {username ? (
        <p className="text-2xl bg-black bg-opacity-30 px-6 py-3 rounded-lg shadow mb-6">
          ยินดีต้อนรับคุณ <span className="font-semibold">{username}</span>
        </p>
      ) : (
        <p className="italic">กำลังโหลดข้อมูลผู้ใช้...</p>
      )}

      <div className="w-full max-w-4xl bg-white bg-opacity-80 text-black rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">📋 สินค้าของคุณ</h2>
        {products.length > 0 ? (
          <ul className="space-y-4">
            {products.map((product) => (
              <li
                key={product.product_id}
                className="bg-white bg-opacity-90 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 shadow cursor-pointer hover:bg-indigo-100"
                onClick={() => setSelectedProduct(product)}
              >
                {product.product_images?.[0]?.image_url ? (
                  <img
                    src={product.product_images[0].image_url}
                    alt={product.product_name ?? ''}
                    className="w-32 h-32 object-cover rounded"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded text-gray-500">
                    ไม่มีรูปภาพ
                  </div>
                )}
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold">{product.product_name}</h3>
                  <p className="italic text-gray-700 text-sm">{product.product_description}</p>
                  <p className="mt-2 font-semibold text-green-700">
                    💰 ราคา: {getDisplayPrice(product)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-gray-600 text-center">ยังไม่มีสินค้าในร้าน</p>
        )}
      </div>

      <div className="text-right mt-6 space-y-4 w-full max-w-4xl">
        <button
          onClick={() => router.push('/cart')}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg shadow transition w-full md:w-auto"
        >
          🛒 ไปดูตะกร้าสินค้า
        </button>

        <button
          onClick={() => router.push('/orderhistory')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition w-full md:w-auto"
        >
          📦 ดูประวัติคำสั่งซื้อ
        </button>

        <button
          onClick={() => router.push('/groupbuying')}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition w-full md:w-auto"
        >
          🤝 ไปหน้า Group Buying
        </button>

        <button
          onClick={handleLogout}
          className="mt-8 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition"
        >
          Logout / Clear Token
        </button>
      </div>
    </div>
  );
}
