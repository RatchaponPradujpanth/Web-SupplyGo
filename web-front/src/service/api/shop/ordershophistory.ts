import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ======= Types =======

export interface Address {
  address_id: number;
  user_id?: number;
  firstname?: string;
  lastname?: string;
  phone_number?: number;
  house_number?: string;
  street?: string;
  sub_district?: string;
  district?: string;
  province?: string;
  postal_code?: number;
  address_type?: string;
}

export interface User {
  user_id: number;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  registration_date?: string;
}

export interface ProductImage {
  product_images_id: number;
  product_id?: number;
  image_url: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface Product {
  product_id: number;
  product_name?: string;
  product_description?: string;
  price?: string | number;
  category_id?: number;
  status?: string;
  created_date?: string;
  updated_date?: string;
  product_images: ProductImage[];
}

export interface Option {
  option_id: number;
  name: string;
  product_id?: number;
}

export interface VariantOption {
  variant_option_id: number;
  variant_id: number;
  option_id: number;
  value: string;
  option: Option;
}

export interface OrderItem {
  order_item_id: number;
  order_shop_id: number;
  product_id: number;
  variant_option_id?: number;
  quantity: number;
  price_per_unit: string | number;
  total_price: string | number;
  product?: Product; // บาง API อาจส่งมาเป็น product
  products?: Product; // บาง API อาจส่งมาเป็น products
  variant_option?: VariantOption;
}

export interface Order {
  order_id: number;
  address_id: number;
  user_id: number;
  order_date?: string;
  total_amount?: string | number;
  status?: string;
  users?: User; // ใช้ users แทน user ตามข้อมูลจริงจาก backend
  address: Address;
}

export interface NormalOrder {
  order_shop_id: number;
  order_id: number;
  shop_id: number;
  subtotal: string | number;
  status: string;
  tracking_number?: string;
  charge_id?: string;
  transaction_id?: string;
  order: Order;
  order_items: OrderItem[];
}

export interface GroupMemberAddress {
  group_member_addresses_id: number;
  group_member_id?: number;
  address_id?: number;
  address: Address;
}

export interface GroupMember {
  group_members_id: number;
  group_buying_id?: number;
  user_id?: number;
  joined_at?: string;
  user: User;
  member_addresses: GroupMemberAddress[];
}

export interface GroupMemberOrder {
  group_member_order_id: number;
  group_order_id?: number;
  group_member_id?: number;
  status: string;
  tracking_number?: string;
  group_member: GroupMember;
  order_items?: OrderItem[]; // เพิ่ม order_items สำหรับ member order
}

export interface GroupOrderItem {
  group_order_item_id: number;
  group_order_id?: number;
  product_id: number;
  variant_option_id?: number;
  quantity: number;
  price_per_unit: string | number;
  product?: Product; // บาง API อาจส่งมาเป็น product
  products?: Product; // บาง API อาจส่งมาเป็น products
  variant_option?: VariantOption;
}

export interface GroupBuying {
  group_buying_id: number;
  shop_id: number;
  group_name?: string;
  product_id?: number;
  min_quantity?: number;
  current_quantity?: number;
  group_price?: string | number;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface GroupOrder {
  group_order_id: number;
  group_buying_id: number;
  total_amount?: string | number;
  status?: string;
  created_at?: string;
  group?: GroupBuying; // เพิ่ม group information
  group_name?: string; // บางครั้งอาจส่ง group_name มาตรงๆ
  items: GroupOrderItem[];
  member_orders: GroupMemberOrder[];
}

export interface ShopOrderResponse {
  normalOrders: NormalOrder[];
  groupOrders: GroupOrder[];
}

// ======= API Calls =======

export const getShopOrderHistory = async (
  token: string,
  trackingNumber?: string
): Promise<ShopOrderResponse> => {
  try {
    console.log(
      trackingNumber ? { tracking_number: trackingNumber } : {}
    );
    const response = await axios.get<ShopOrderResponse>(
      `${API_URL}/api/shoporderhistory`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: trackingNumber ? { tracking_number: trackingNumber } : {},
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ โหลดข้อมูลคำสั่งซื้อร้านค้าไม่สำเร็จ:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateTrackingNumber = async (
  token: string,
  orderShopId: number,
  trackingNumber: string
): Promise<void> => {
  try {
    const payload = { orderShopId, trackingNumber };
    console.log(
      "📤 PATCH /orders/tracking request body:",
      JSON.stringify(payload, null, 2)
    );
    const response = await axios.patch(
      `${API_URL}/api/orders/tracking`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    );
    console.log(
      "📥 Backend response:",
      JSON.stringify(response.data, null, 2)
    );
  } catch (error: any) {
    console.error(
      "❌ updateTrackingNumber error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateStatus = async (
  token: string,
  orderShopId: number,
  status: string
): Promise<void> => {
  try {
    const payload = { orderShopId, status };
    console.log(
      "📤 PATCH /orders/status request body:",
      JSON.stringify(payload, null, 2)
    );
    const response = await axios.patch(`${API_URL}/api/orders/status`, payload, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    console.log(
      "📥 Backend response:",
      JSON.stringify(response.data, null, 2)
    );
  } catch (error: any) {
    console.error("❌ updateStatus error:", error.response?.data || error.message);
    throw error;
  }
};