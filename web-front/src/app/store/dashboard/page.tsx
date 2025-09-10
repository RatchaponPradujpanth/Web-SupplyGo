"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadUsername,
  loadstorename,
  regisstripe,
  fetchUserRole,
  loadproduct,
} from '@/service/apis';
import dotenv from 'dotenv';
// Import interface จาก src/types/product.ts
import type {
  Product,
} from '@/types/product';
import { primarypicture } from '@/service/api/setprimarypicture';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StoreDashboardPage() {
  const [username, setUsername] = useState('');
  const [storeName, setStoreName] = useState('');
  const [shopId, setShopId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [primaryImages, setPrimaryImages] = useState<Record<number, string | null>>({});
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const role = await fetchUserRole(token);
      if (role !== 'store') {
        router.push('/user-dashboard');
        return;
      }

      const name = await loadUsername(token);
      setUsername(name);

      const store = await loadstorename(token);
      setStoreName(store.shop_name);
      setShopId(store.shop_id);
      setStripeConnected(Boolean(store.stripe_account_id));

      const productList = await loadproduct(token);

      const fixedProductList: Product[] = productList.map((p: any) => ({
        product_id: p.product_id,
        product_name: p.product_name ?? null,
        product_description: p.product_description ?? null,
        price: p.price !== null && p.price !== undefined ? Number(p.price) : null,
        status: p.status ?? null,
        image: p.image ?? null,
        product_variants: (p.product_variants ?? []).map((variant: any) => ({
          variant_id: variant.variant_id,
          sku: variant.sku,
          price: variant.price ?? null,
          stock_quantity: variant.stock_quantity ?? null,
          image: variant.image,
          variant_options: (variant.variant_options ?? []).map((vo: any) => ({
            option_name: vo.option_name,
            value: vo.value,
          })),
        })),
        product_images: (p.product_images ?? []).map((img: any) => ({
          id: img.id,
          image_url: img.image_url.startsWith('http')
            ? img.image_url
            : `${API_URL}${img.image_url.startsWith('/') ? '' : '/'}${img.image_url}`,
          is_primary: img.is_primary ?? false,
          sort_order: img.sort_order ?? null,
        })),
      }));

      setProducts(fixedProductList);

      // เซ็ต primaryImages state
      const mapPrimary: Record<number, string | null> = {};
      fixedProductList.forEach((p) => {
        const primaryImg =
          p.product_images?.find((img) => img.is_primary)?.image_url || p.image || null;
        mapPrimary[p.product_id] = primaryImg;
      });
      setPrimaryImages(mapPrimary);
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleSetPrimary = async (productId: number, imageId: number) => {
    try {
      await primarypicture(productId, imageId);
      alert('ตั้งรูปหลักสำเร็จ');

      // อัปเดตรูปหลักใน state ทันที
      const product = products.find((p) => p.product_id === productId);
      if (!product) return;

      const newPrimaryImageUrl = product.product_images.find(img => img.id === imageId)?.image_url || null;
      if (newPrimaryImageUrl) {
        setPrimaryImages(prev => ({ ...prev, [productId]: newPrimaryImageUrl }));
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการตั้งรูปหลัก');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold mb-8 drop-shadow-lg">📦 Store Dashboard</h1>

      <div className="bg-white bg-opacity-90 text-black rounded-xl shadow-xl p-8 w-full max-w-5xl mb-8 text-center">
        <p className="text-2xl font-semibold">
          👋 ยินดีต้อนรับคุณ <span className="text-indigo-700">{username}</span>
        </p>
        <p className="text-xl mt-3">
          🏪 ร้าน: <span className="font-semibold">{storeName}</span>
        </p>
        <p className="text-md mt-1 text-gray-700">🆔 Shop ID: {shopId}</p>

        {stripeConnected ? (
          <p className="text-green-600 mt-6 font-semibold text-lg">✅ เชื่อมต่อ Stripe แล้ว</p>
        ) : (
          <button
            onClick={() => regisstripe(localStorage.getItem('token')!)}
            className="mt-6 px-8 py-3 bg-green-600 hover:bg-green-700 transition rounded-lg font-semibold shadow-md"
          >
            ➕ เชื่อมบัญชี Stripe
          </button>
        )}
      </div>

      <div className="w-full max-w-5xl bg-white bg-opacity-90 text-black rounded-xl p-8 shadow-xl overflow-x-auto">
        <h2 className="text-3xl font-semibold mb-6 border-b border-gray-300 pb-2">📋 รายการสินค้า</h2>

        {products.length > 0 ? (
          <ul className="space-y-10">
            {products.map((product) => (
              <li
                key={product.product_id}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="md:flex md:space-x-6">
                  {/* รูปหลักใหญ่ */}
                  {primaryImages[product.product_id] ? (
                    <img
                      src={primaryImages[product.product_id]!}
                      alt={product.product_name ?? ''}
                      className="w-56 h-56 object-cover rounded-xl mb-4 border-4 border-indigo-500 shadow-lg flex-shrink-0"
                    />
                  ) : (
                    product.image && (
                      <img
                        src={product.image}
                        alt={product.product_name ?? ''}
                        className="w-56 h-56 object-cover rounded-xl mb-4 border-4 border-indigo-300 shadow-md flex-shrink-0"
                      />
                    )
                  )}

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-indigo-700">{product.product_name}</h3>
                    <p className="italic text-gray-600 mt-1">{product.product_description}</p>
                    <p className="mt-3 font-semibold text-green-700 text-lg">
                      💰 ราคา:{' '}
                      {product.price != null && !isNaN(Number(product.price))
                        ? `฿${Number(product.price).toFixed(2)}`
                        : 'N/A'}
                    </p>

                    {/* รูปหลายรูป product_images */}
                    {product.product_images && product.product_images.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3 text-lg">🖼️ รูปภาพเพิ่มเติม</h4>
                        <div className="flex flex-wrap gap-3">
                          {product.product_images.map((img, idx) => {
                            const isPrimaryNow = primaryImages[product.product_id] === img.image_url;

                            return (
                              <div
                                key={`${img.id}-${idx}`}
                                className="relative group rounded-lg overflow-hidden border border-gray-300 shadow-sm"
                              >
                                <img
                                  src={img.image_url}
                                  alt={`รูปสินค้า ${product.product_name}`}
                                  className={`w-24 h-24 object-cover transition-transform duration-200 group-hover:scale-105`}
                                />
                                {/* ปุ่มตั้งรูปหลัก */}
                                {!isPrimaryNow && (
                                  <button
                                    onClick={() => handleSetPrimary(product.product_id, img.id)}
                                    className="absolute bottom-1 left-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded opacity-90 group-hover:opacity-100 transition"
                                  >
                                    ตั้งเป็นรูปหลัก
                                  </button>
                                )}
                                {/* ติด Badge ถ้าเป็นรูปหลัก */}
                                {isPrimaryNow && (
                                  <div className="absolute top-0 right-0 bg-green-600 text-white text-xs px-2 py-0.5 rounded-bl font-semibold">
                                    รูปหลัก
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ตาราง Variants แสดงแค่ SKU, ราคา, สต็อก */}
                {product.product_variants && product.product_variants.length > 0 && (
                  <div className="mt-8 overflow-auto rounded-lg border border-gray-300">
                    <h4 className="font-semibold mb-4 text-lg bg-gray-100 p-3 rounded-t-lg text-gray-700">
                      🎛️ ตัวเลือกย่อย (Variants)
                    </h4>
                    <table className="min-w-full text-sm table-auto">
                      <thead className="bg-gray-200 text-gray-700">
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-left">SKU</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">ราคา</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">สต็อก</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.product_variants.map((variant) => (
                          <tr
                            key={variant.variant_id}
                            className="odd:bg-white even:bg-gray-50 hover:bg-indigo-50"
                          >
                            <td className="border border-gray-300 px-3 py-2">{variant.sku ?? '-'}</td>
                            <td className="border border-gray-300 px-3 py-2">
                              ฿
                              {variant.price != null && !isNaN(Number(variant.price))
                                ? Number(variant.price).toFixed(2)
                                : '-'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">{variant.stock_quantity ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-gray-600 text-center py-20 text-lg">
            ยังไม่มีสินค้าในร้าน
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center w-full max-w-5xl">
        <button
          onClick={() => router.push('/addproduct')}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-lg shadow-md transition"
        >
          ➕ เพิ่มสินค้า
        </button>

        <button
          onClick={() => router.push('/shop-order')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition"
        >
          📦 จัดการออเดอร์
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="mt-10 px-10 py-4 bg-red-600 hover:bg-red-700 rounded-lg transition text-white font-semibold shadow-lg"
      >
        🚪 Logout / ออกจากระบบ
      </button>
    </div>
  );
}
