// ========================
// Product-related Types
// ========================

// src/types/product.ts

export interface VariantOption {
  value: string;
  option_name: string;
}

export interface ProductBatch {
  batch_id: number;
  batch_number: string;
  manufactured_date: string;
  expiry_date: string;
  quantity: number;
}

export interface ProductVariant {
  variant_id: number;
  sku: string;
  price: number | null;
  total_stock: number;          // stock ของ variant
  batches?: ProductBatch[];     // batch ของ variant
  image: string | null;
  variant_options: VariantOption[];
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary?: boolean;
  sort_order?: number | null;
}

export interface Product {
  product_id: number;
  product_name: string | null;
  product_description: string | null;
  price: number | null;
  status?: string | null;
  image: string | null;
  total_stock: number;          // stock ของสินค้าหลัก (ไม่มี variant)
  batches?: ProductBatch[];     // batch ของสินค้าหลัก
  product_variants?: ProductVariant[];  // มีหรือไม่มี variant ก็ได้
  product_images?: ProductImage[];
}


export interface ProductImage {
  id: number;
  image_url: string;
  is_primary?: boolean;
  sort_order?: number | null;
}

export type ProductOption = {
  option_id: number;
  name: string;
  product_id: number;
  variant_options: VariantOption[];
};

export interface Category {
  category_id: number;
  category_name: string;
}

// Variant Option Type
export interface VariantOption {
  variant_option_id: number;
  value: string;
  option_name: string;
  option_id: number;
}

// Variant Type
export interface Variant {
  variant_id: number;
  sku?: string;
  price?: number;
  stock_quantity?: number;
  image?: string;
}

// ========================
// Shop-related Types
// ========================
export type Shop = {
  shop_id: number;
  shop_name?: string;
};

export type ProductOwner = {
  shop_id: number;
  shops?: Shop;
  product_id: number;
};

export type TransferItem = {
  storeId: number;
  amount: number;
};

// ========================
// Cart & Checkout
// ========================
export interface CartItem {
  cart_item_id: number;
  quantity: number;
  price_per_unit: number;
  product_name: string;
  image: string | null;
  shop_name: string;
  variant_id?: number;
  variant_info?: string; // เพิ่ม variant_info
  total_price: number;
  product_id: number;
}

// ใช้เฉพาะตอน checkout (รวม variant, shop_name, image)
export interface CheckoutItem {
  cart_item_id: number;
  product_name: string;
  shop_name: string;
  shop_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product_id: number;
  variant_id?: number | null;
  variant?: Variant | null;
  variant_options?: VariantOption[];
  image?: string;
}

export interface CartItemWithExtra extends CartItem {
  variant_option_ids?: number[];
}

export interface CartResponse {
  cart_id: number;
  items: CartItem[];
  cart_items: any[];
  total_amount: number;
}

// ❌ CheckoutSummary ซ้ำกับ CartSummaryResponse → เลือกใช้ CartSummaryResponse
export interface CartSummaryResponse {
  cart_id: number;
  items: CheckoutItem[];
  totalAmount: number;
}

// ========================
// Order-related Types
// ========================
export interface CreateOrderPayload {
  addressId: number;
  totalAmount: number;
  cartItems: {
    productId: number;
    quantity: number;
    price_per_unit: number;
    shopId: number;
    variant_id?: number | null;
    variant_option_ids?: number[];
    total_price?: number;
  }[];
}

export interface CreateOrderResponse {
  order_id: number;
  status: string;
  total_amount: number;
  message: string;
}

export interface OrderHistoryResponse {
  orders: {
    order_id: number;
    address_id: number;
    order_date: string;
    total_amount?: number;
    status?: string;
    address?: {
      address_id: number;
      firstname: string;
      lastname: string;
      phone_number: string;
      house_number: string;
      street: string;
      sub_district: string;
      district: string;
      province: string;
      postal_code: string;
    } | null;
    order_shops: {
      order_shop_id: number;
      shop_id: number;
      subtotal: number;
      status: string;
      tracking_number: string;
      shops: { shop_name: string };
      order_items: {
        order_item_id: number;
        product_id: number;
        quantity: number;
        price_per_unit: number;
        total_price: number;
        products: {
          product_name: string;
          product_images: { image_url: string }[];
        };
        variant_option: {
          value: string;
          option: { name: string };
          variant: { sku: string };
        } | null;
      }[];
    }[];
  }[];
}

// ⚠️ ShopOrderResponse ใช้ any[] → ถ้าไม่ได้ใช้จริงแนะนำลบ
export interface ShopOrderResponse {
  orders: any[];
  order_shops: any[];
  order_items: any[];
  addresses: any[];
}

export interface ShopOrder {
  order_shop_id: number;
  order_id: number;
  shop_id: number;
  subtotal: number;
  status: string;
  tracking_number: string;
}

// ========================
// Payment
// ========================
export interface ShopPaymentIntent {
  shop_id: number;
  shop_name: string;
  amount: number;
  client_secret: string;
  stripe_account: string;
}

export interface PaymentIntentInfo {
  shop_id: number;
  amount: number;
  payment_intent_id: string;
}

// ========================
// Address
// ========================
export interface Address {
  address_id: number;
  firstname: string;
  lastname: string;
  phone_number: number;
  house_number: string;
  street: string;
  sub_district: string;
  district: string;
  province: string;
  postal_code: number;
  address_type: string;
}

// ========================
// Auth & User
// ========================
export interface LoginResponse {
  token: string;
}

export interface users {
  user_id: number;
  username: string | null;
  email: string | null;
  role?: string | null;
}

// ========================
// DB-like Types
// ========================
export interface cart {
  cart_id: number;
  user_id: number;
  created_at?: string;
  updated_at?: string;
  cart_items?: CartItem[];
}

export interface order {
  order_id: number;
  user_id: number;
  address_id: number;
  order_date?: string;
  total_amount?: number;
  status?: string;
}

export interface order_items {
  order_item_id: number;
  order_shop_id: number;
  product_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  variant_option?: VariantOption | null;
}

export interface order_shops {
  order_shop_id: number;
  order_id: number;
  shop_id: number;
  subtotal: number;
  status: string;
  tracking_number?: string | null;
  transaction_id?: string | null;
  charge_id?: string | null;
}

export interface product_batches {
  batch_id: number;
  product_id: number;
  batch_number?: string | null;
  manufactured_date?: string | null;
  expiry_date?: string | null;
  quantity?: string | null;
}

// ========================
// Group Buying
// ========================
export interface group_members {
  id: number;
  group_id: number;
  user_id: number;
  joined_at: string;
}

export interface GroupBuying {
  group_buying_id: number;
  points_per_member: number;
  shop_id: number;
  product_id: number;
  required_members: number;
  total_items: number;
  status: 'open' | 'success' | 'closed';
  created_at: string;

  group_name?: string | null;
  description?: string | null;
  expire_at?: string | null;
  variant_id?: number | null;

  shop?: { shop_name?: string };
  product?: {
    product_id: number;
    product_name?: string;
    product_images?: { image_url: string }[];
  };
  members?: { user_id: number; username?: string }[];

  user_in_group?: boolean;
  current_members?: number;
  is_full?: boolean;
}

export interface GroupBuyingMember {
  id: number;
  joined_at: string;
  user_id: number;
  username: string | null;
  email: string | null;
}

export interface GroupBuyingProduct {
  product_name: string | null;
  image: string | null;
  secondary_images?: string[];
}

export interface GroupBuyingResult {
  group_buying_id: number;
  group_name?: string | null;
  description?: string | null;
  expire_at?: string | null;
  product_id: number;
  variant_id?: number | null;
  product_name: string | null;
  product_image: string | null;
  secondary_images: string[];
  total_items: number;
  required_members: number;
  status: string;
  created_at: string;
  points_per_group: number;
  points_per_member: number;
  member_count: number;
  members: GroupBuyingMember[];
}

// ========================
// Admin Dashboard
// ========================
export interface AdminDashboardApiResponse {
  message: string;
  dashboard: {
    totalUsers: number;
    totalStores: number;
    totalProducts: number;
    totalOrders: number;
    recentOrders: {
      order_id: number;
      status: string;
      total_amount: number;
      order_date: string;
      users: { username: string }[];
    }[];
    recentProducts: {
      product_id: number;
      product_name: string;
      price: number;
      status: string;
      created_date: string;
      product_owners: { shops: { shop_name: string } }[];
    }[];
  };
}

// ========================
// Other
// ========================
export interface userpoint {
  balance: number;
}

