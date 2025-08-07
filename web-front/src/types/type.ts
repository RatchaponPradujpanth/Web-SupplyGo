// src/types/product.ts

export interface VariantOption {
  variant_option_id: number
  variant_id: number
  option_id : number
  value: string;
  //option_name: string;
}

export interface ProductVariant {
  variant_id: number;
  sku: string;
  price: number | null;
  stock_quantity: number | null;
  image: string | null;
  variant_options: VariantOption[];
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

export interface Product {
  product_id: number;
  product_name: string | null;
  product_description: string | null;
  price: number | null;
  status?: string | null;
  image: string | null;

  // ความสัมพันธ์
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
  product_options?: ProductOption[]; // เพิ่มฟิลด์นี้

  product_owners?: ProductOwner[];
}

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

export interface Category {
  category_id: number;
  category_name: string;
}

export interface CheckoutItem {
  cart_item_id: number;
  product_name: string;
  shop_name: string;
  shop_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
}

export interface CheckoutSummary {
  cart_id: number;
  items: CheckoutItem[];
  totalAmount: number;
}

export interface LoginResponse {
  token: string;
}

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


export interface CartItemWithExtra extends CartItem {
  variant_option_ids?: number[];
}

export interface CartResponse {
  cart_id: number;
  items: CartItem[];
}

export interface OrderHistoryResponse {
  orders: {
    order_id: number;
    address_id: number;
    order_date: string;
    total_amount?: number;
    status?: string;
    address?: {   // <== เพิ่มฟิลด์นี้
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
      shops: {
        shop_name: string;
      };
      order_items: {
        order_item_id: number;
        product_id: number;
        quantity: number;
        price_per_unit: number;
        total_price: number;
        products: {
          product_name: string;
          product_images: {
            image_url: string;
          }[];
        };
        variant_option: {
          value: string;
          option: {
            name: string;
          };
          variant: {
            sku: string;
          };
        } | null;
      }[];
    }[];
  }[];
}
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
