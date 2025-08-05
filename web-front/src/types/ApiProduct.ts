// src/types/api.ts - สร้างไฟล์นี้เพื่อเก็บ type สำหรับ API response

export interface ApiProductImage {
  id: number;                    // ✅ API ส่งมาเป็น id ไม่ใช่ image_id
  image_url: string;
  is_primary: boolean;
  sort_order: number | null;
}

export interface ApiVariantOption {
  value: string;
  option_name: string;
}

export interface ApiProductVariant {
  variant_id: number;
  sku: string;
  price: number | null;
  stock_quantity: number | null;
  image: string | null;
  variant_options: ApiVariantOption[];
}

export interface ApiProduct {
  product_id: number;
  product_name: string | null;
  product_description: string | null;
  price: number | null;
  status: string | null;
  image: string | null;
  product_variants: ApiProductVariant[];
  product_images: ApiProductImage[];
}