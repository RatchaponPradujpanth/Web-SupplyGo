'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import axios from 'axios';
import Footer from '@/components/layout/Footer';
import { fetchUserRole } from '@/service/apis';

interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

interface VariantOption {
  variant_option_id: number;
  option_id: number;
  value: string;
  option_name: string;
}

interface ProductVariant {
  variant_id: number;
  sku: string;
  price: number;
  variant_options: VariantOption[];
}

interface Product {
  product_id: number;
  product_name: string;
  product_description: string;
  price: number;
  category_name?: string;
  product_images: ProductImage[];
  product_variants?: ProductVariant[];
  product_options?: {
    option_id: number;
    name: string;
  }[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'description' | 'specs'>('description');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // ✅ ตรวจสอบ role - ห้าม admin และ store เข้าหน้านี้
  useEffect(() => {
    const checkRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) return; // ถ้าไม่มี token ให้ผ่านไปก่อน (guest)

      try {
        const userRole = await fetchUserRole(token);
        if (userRole === 'admin' || userRole === 'store') {
          alert('⚠️ คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
          router.push('/'); // redirect ไปหน้าหลัก
        }
      } catch (error) {
        console.error('Error checking role:', error);
      }
    };

    checkRole();
  }, [router]);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(`${API_URL}/api/products/${productId}`, { headers });
        const productData = response.data;

        console.log('🔍 Product data from API:', productData);
        console.log('🔍 Product variants:', productData.product_variants);
        console.log('🔍 Product options:', productData.product_options);

        setProduct(productData);
        
        // ตั้งรูปแรกเป็นรูปหลัก
        const primaryImage = productData.product_images?.find((img: ProductImage) => img.is_primary);
        const firstImage = primaryImage || productData.product_images?.[0];
        if (firstImage) {
          // แปลง URL ให้ถูกต้อง
          let imageUrl = firstImage.image_url;
          if (!imageUrl.startsWith('http')) {
            imageUrl = `${API_URL}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
          }
          setSelectedImage(imageUrl);
        }

        // โหลดสินค้าที่เกี่ยวข้อง (same category)
        if (productData.category_name) {
          try {
            const relatedResponse = await axios.get(`${API_URL}/api/loaduserproduct`);
            const allProducts = relatedResponse.data;
            
            // กรองเฉพาะสินค้าที่ category เดียวกัน และไม่ใช่สินค้าตัวเอง
            const related = allProducts
              .filter((p: Product) => 
                p.category_name === productData.category_name && 
                p.product_id !== productData.product_id
              )
              .slice(0, 4); // เอาแค่ 4 รายการ
            
            setRelatedProducts(related);
          } catch (error) {
            console.error('Error loading related products:', error);
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
        alert('ไม่สามารถโหลดข้อมูลสินค้าได้');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, API_URL]);

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      router.push('/login');
      return;
    }

    try {
      // ถ้ามี variants ต้องเลือกให้ครบ
      if (product?.product_options && product.product_options.length > 0) {
        const allSelected = product.product_options.every(opt => selectedOptions[opt.name]);
        if (!allSelected) {
          alert('⚠️ กรุณาเลือกตัวเลือกสินค้าให้ครบ');
          return;
        }
      }

      // หา variant_id ที่ตรงกับตัวเลือกที่เลือก
      let variantId = null;
      if (product?.product_variants && Object.keys(selectedOptions).length > 0) {
        const matchedVariant = product.product_variants.find(variant => {
          return variant.variant_options.every(opt => 
            selectedOptions[opt.option_name] === opt.value
          );
        });
        variantId = matchedVariant?.variant_id || null;
      }

      await axios.post(
        `${API_URL}/api/addtocart`,
        {
          product_id: product?.product_id,
          quantity,
          variant_id: variantId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      alert('✅ เพิ่มสินค้าลงตะกร้าแล้ว');
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('❌ ไม่สามารถเพิ่มสินค้าลงตะกร้าได้');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    // จะไปหน้า cart อยู่แล้วจาก handleAddToCart
  };

  const getCurrentPrice = () => {
    if (!product) return 0;

    // ถ้ามี variants และเลือกครบแล้ว
    if (product.product_variants && Object.keys(selectedOptions).length > 0) {
      const matchedVariant = product.product_variants.find(variant => {
        return variant.variant_options.every(opt => 
          selectedOptions[opt.option_name] === opt.value
        );
      });
      if (matchedVariant) return matchedVariant.price;
    }

    return product.price;
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return 'ติดต่อร้านค้า';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  // จัดกลุ่ม options
  const groupedOptions = product?.product_variants?.reduce((acc, variant) => {
    variant.variant_options.forEach(opt => {
      if (!acc[opt.option_name]) {
        acc[opt.option_name] = new Set();
      }
      acc[opt.option_name].add(opt.value);
    });
    return acc;
  }, {} as Record<string, Set<string>>) || {};

  console.log('🔍 Grouped options:', groupedOptions);
  console.log('🔍 Number of option groups:', Object.keys(groupedOptions).length);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">ไม่พบสินค้า</h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgpage">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-textmuted mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          {product.category_name && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/category/${product.category_name}`} className="hover:text-primary">
                {product.category_name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-textmain">Product</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-card shadow-card overflow-hidden mb-4"
            >
              <div className="aspect-square relative">
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt={product.product_name}
                    fill
                    className="object-contain p-4"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    📦
                  </div>
                )}
              </div>
            </motion.div>

            {/* Thumbnails */}
            {product.product_images && product.product_images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.product_images.map((img) => {
                  let imageUrl = img.image_url;
                  if (!imageUrl.startsWith('http')) {
                    imageUrl = `${API_URL}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                  }
                  return (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(imageUrl)}
                      className={`aspect-square relative bg-white rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === imageUrl
                          ? 'border-primary'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${product.product_name} thumbnail`}
                        fill
                        className="object-contain p-2"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-textmain mb-4">{product.product_name}</h1>
            
            <div className="text-4xl font-bold text-primary mb-6">
              {formatPrice(getCurrentPrice())}
            </div>

            {/* Options */}
            {Object.entries(groupedOptions).map(([optionName, values]) => (
              <div key={optionName} className="mb-6">
                <h3 className="text-sm font-medium text-textmain mb-3">{optionName}</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(values).map((value) => (
                    <button
                      key={value}
                      onClick={() => setSelectedOptions({ ...selectedOptions, [optionName]: value })}
                      className={`px-6 py-2 rounded-lg border-2 transition ${
                        selectedOptions[optionName] === value
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 bg-white hover:border-primary'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-textmain mb-3">Qty</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  -
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-secondary text-textmain font-semibold rounded-lg hover:bg-secondary/90 transition shadow-md"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition shadow-md"
              >
                Buy Now
              </button>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex gap-6 border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`pb-2 font-medium transition ${
                    activeTab === 'description'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-textmuted hover:text-textmain'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 font-medium transition ${
                    activeTab === 'specs'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-textmuted hover:text-textmain'
                  }`}
                >
                  Specs
                </button>
              </div>

              {activeTab === 'description' && (
                <div className="text-textmuted leading-relaxed">
                  {product.product_description || 'Detailed description of the product goes here in a few paragraphs for layout.'}
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="text-textmuted">
                  <ul className="space-y-2">
                    <li><strong>Product ID:</strong> {product.product_id}</li>
                    {product.category_name && (
                      <li><strong>Category:</strong> {product.category_name}</li>
                    )}
                    {product.product_variants && product.product_variants.length > 0 && (
                      <li><strong>Variants:</strong> {product.product_variants.length} options available</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related products</h2>
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => {
                const productImage = (relatedProduct as Product & { image?: string }).image || relatedProduct.product_images?.[0]?.image_url;
                const imageUrl = productImage ? getImageUrl(productImage) : null;
                
                return (
                  <button
                    key={relatedProduct.product_id}
                    onClick={() => router.push(`/product/${relatedProduct.product_id}`)}
                    className="bg-white rounded-card shadow-card overflow-hidden hover:shadow-lg transition group"
                  >
                    <div className="aspect-square relative bg-gray-50">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={relatedProduct.product_name}
                          fill
                          className="object-contain p-4 group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-textmain line-clamp-2 mb-2">
                        {relatedProduct.product_name}
                      </p>
                      <p className="text-primary font-bold">
                        {formatPrice(relatedProduct.price)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-card shadow-card p-4 text-center text-textmuted">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4"></div>
                  <p>No related products</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
