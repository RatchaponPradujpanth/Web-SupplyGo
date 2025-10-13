import axios, { AxiosError } from "axios";

//export const API_URL = "http://192.168.1.49:5000";  

const API_URL = process.env.NEXT_PUBLIC_API_URL;


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

export interface Product {
  product_id: number;
  product_name: string;
  product_description: string;
  price: number;
  image: string;
  product_owners?: ProductOwner[];

  // 🆕 เพิ่มส่วนนี้เพื่อรองรับ relations
  status?: string;
  product_variants?: {
    variant_id: number;
    sku: string;
    price: number;
    stock_quantity: number;
    option_values: string[];
  }[];

  product_images?: {
    image_id: number;
    image_url: string;
  }[];
}

interface CartItem {
  cart_item_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product_name: string;
  image: string;
  shop_name: string;
}


import type { CartResponse } from "@/types/type";
import { dot } from "node:test/reporters";
// interface CartResponse {
//   cart_id: number | null;
//   items: CartItem[];
// }

export interface OrderHistoryResponse {
  orders: {
    order_id: number;
    address_id: number;
    order_date: string;
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
      }[];
    }[];
  }[];
  addresses: {
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
  }[];
}


// export const RegisterUser = async (
//   username: string,
//   password: string,
//   email: string
// ): Promise<void> => {
//   try {
//     const response = await axios.post(`${API_URL}/api/register`, {
//       username,
//       password,
//       email,
//     });
//   } catch (error: unknown) {
//     const err = error as AxiosError<{ message?: string }>;
//     const errorMsg =
//       err.response?.data?.message || err.message || "Register error";

//     console.error("Register error:", errorMsg);
//     throw new Error(errorMsg);
//   }
// };

export const loginUser = async (
  username: string,
  password: string
): Promise<string> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_URL}/api/login`, {
      username,
      password,
    });

    const { token } = response.data || {};

    if (!token) {
      throw new Error("Login failed: Missing token ");
    }

    localStorage.setItem("token", token); // เก็บ token ตรงนี้เลย

    return token;
  } catch (error: unknown) {
    // handle error
    throw error;
  }
};

export const loadUsername = async (token: string): Promise<string> => {
  try {
    const response = await axios.get<{ username: string }>(
      `${API_URL}/api/loadusername`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.username;
  } catch (error) {
    console.error("Load username error:", error);
    throw error;
  }
};

export const loadproduct = async (token: string): Promise<Product[]> => {
  if (!token) throw new Error("No token provided");
  try {
    const response = await axios.get<Product[]>(`${API_URL}/api/manageproducts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Products fetched:", response.data);
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Failed to load products";

    // ถ้าแค่ไม่มีสินค้า ก็ return [] ไปเลย
    if (errorMsg === "No products found") {
      console.warn("⚠️ No products found, returning empty list.");
      return [];
    }

    console.error("Error fetching products:", errorMsg);
    throw new Error(errorMsg);
  }
};

export const loadstorename = async (
  token: string
): Promise<{ shop_name: string; shop_id: number; stripe_account_id?: string | null }> => {
  try {
    console.log("📦 loading store with token:", token); // ตรวจ token
    const response = await axios.get<{ shop_name: string; shop_id: number }>(
      `${API_URL}/api/loadstorename`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("✅ ได้idร้าน:", response.data.shop_id);
    return response.data;
  } catch (error) {
    console.error("Load store name error:", error);
    throw error;
  }
};

export const regisstripe = async (token: string): Promise<void> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/regisstripe`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = response.data;

    if (data.url) {
      console.log("🔗 ไปยัง Stripe:", data.url);
      window.location.href = data.url; // เปลี่ยนหน้าไปยังลิงก์ onboarding
    } else {
      throw new Error("ไม่ได้รับลิงก์จาก Stripe");
    }
  } catch (error: any) {
    console.error("❌ Stripe register error:", error.message);
    throw error;
  }
};

export const confirmStripeConnect = async (
  acct_id: string,
  shop_id: string
): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/api/connect`, {
      params: { acct_id, shop_id },
    });

    return response.data; // เช่น "เชื่อมบัญชี Stripe สำเร็จ"
  } catch (error: any) {
    console.error("❌ Stripe connect confirm error:", error.message);
    throw error;
  }
};

export const cartUser = async (token: string): Promise<CartResponse> => {
  try {
    const response = await axios.get<CartResponse>(`${API_URL}/api/cart`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ต้องใส่ token
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ โหลดตะกร้าไม่ได้:", error.message);
    throw error;
  }
};


export type ShopPaymentIntent = {
  shop_id: number;
  shop_name: string;
  amount: number;
  client_secret: string;
  stripe_account: string;
  order_shop_id: number;
  order_items?: Array<{
    product_id: number;
    product_name: string;
    variant_option?: {
      value: string;
      option_name: string;
      sku: string;
    } | null;
    quantity: number;
    price_per_unit: number;
    total_price: number;
  }>;
};


export async function uploadImages(images: File[]) {
  console.log("🚀 [uploadImages] เริ่มส่งไฟล์จำนวน:", images.length);
  const formData = new FormData();
  images.forEach((file) => {
    console.log("  - เตรียมส่งไฟล์:", file.name);
    formData.append("images", file);
  });

  try {
    const res = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ [uploadImages] Response data:", res.data);
    return res.data;
  } catch (err) {
    console.error("🔥 [uploadImages] Fetch failed:", err);
    throw err;
  }
}

export const addproduct = async (
  token: string,
  product_name: string,
  product_description: string,
  price: number,
  category_id: number,
  imageFiles: File[],
  options: { name: string; values: string[] }[],
  variants: {
    sku: string;
    price: number;
    stock_quantity: number;
    option_values: string[];
  }[],
  batches: {
    batch_number: string;
    manufactured_date: string;
    expiry_date: string;
    quantity: string;
  }[][] // <-- เพิ่มตรงนี้
): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append("product_name", product_name);
    formData.append("product_description", product_description);
    formData.append("price", price.toString());
    formData.append("category_id", category_id.toString());

    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    formData.append("options", JSON.stringify(options));
    formData.append("variants", JSON.stringify(variants));
    formData.append("batches", JSON.stringify(batches)); // <-- เพิ่มตรงนี้

    const response = await axios.post(`${API_URL}/api/add-product`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ เพิ่มสินค้าสำเร็จ", response.data);
  } catch (error) {
    console.error("❌ error ที่ api:", error);
    throw error;
  }
};



// export const getCategories = async (): Promise<Category[]> => {
//   try {
//     const response = await axios.get<Category[]>(`${API_URL}/api/categories`);
//     return response.data;
//   } catch (error) {
//     console.error("❌ ดึง category ไม่สำเร็จ:", error);
//     return [];
//   }
// };

export async function fetchUserRole(token: string): Promise<string> {
  try {
    const res = await axios.get<{ role: string }>(`${API_URL}/api/check-role`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.role;
  } catch (error) {
    console.error("Error fetching user role:", error);
    throw error;
  }
}

export const submitOrder = async (
  token: string,
  cartId: number,
  address_id: number
): Promise<{ order_id: number; message: string }> => {
  try {
     const response = await axios.post(
      `${API_URL}/api/order-success`,
      { cartId, address_id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("❌ บันทึกคำสั่งซื้อไม่สำเร็จ:", error.response?.data || error.message);
    throw error;
  }
};

export interface PaymentIntentInfo {
  shop_id: number;
  amount: number;
  payment_intent_id: string;
}

export interface Address {
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
  address_type: string;
}

export async function confirmOrder(
  token: string,
  cartId: number,
  address: Address,
  paymentIntents: PaymentIntentInfo[]
): Promise<{ success: boolean; orderIds?: number[]; error?: string }> {
  try {
    const response = await axios.post(
      `${API_URL}/api/confirm-orders`,
      {
        cartId,
        address,
        paymentIntents,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, orderIds: response.data.orderIds };
  } catch (error: any) {
    console.error("Confirm order error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "ไม่สามารถบันทึกออเดอร์ได้",
    };
  }
}

export const loadaddress = async (token: string): Promise<Address[]> => {
  try {
    const response = await axios.get<{ addresses: Address[] }>(`${API_URL}/api/address`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.addresses;
  } catch (error) {
    console.error("Load address error:", error);
    throw error;
  }
};




export interface ShopOrderResponse {
  orders: any[];
  order_shops: any[];
  order_items: any[];
  addresses: any[];
}

export const getShopOrderHistory = async (token: string, trackingNumber?: string): Promise<ShopOrderResponse> => {
  try {
    const response = await axios.get<ShopOrderResponse>(`${API_URL}/api/shoporderhistory`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: trackingNumber ? { tracking_number: trackingNumber } : {},
    });
    return response.data;
  } catch (error: any) {
    console.error("❌ โหลดข้อมูลคำสั่งซื้อร้านค้าไม่สำเร็จ:", error.message);
    throw error;
  }
};


export const updateTrackingNumber = async (
  token: string,
  orderShopId: number,
  trackingNumber: string
): Promise<void> => {
  console.log('📡 Sending request:', {
    url: `${API_URL}/api/orders/tracking`, // เอา /api ออก
    orderShopId,
    trackingNumber,
    hasToken: !!token
  });

  try {
    const response = await axios.patch(
      `${API_URL}/api/orders/tracking`, // เอา /api ออก
      {
        orderShopId,
        trackingNumber
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    console.log('✅ Response:', response.data);
  } catch (error: any) {
    console.error("❌ updateTrackingNumber error:", error.response?.data || error.message);
    throw error;
  }
};

export interface ShopOrder {
  order_shop_id: number;
  order_id: number;
  shop_id: number;
  subtotal: number;
  status: string;
  tracking_number: string;
}

export const updatestatus = async (
  token: string,
  orderShopId: number,
  status: string
): Promise<void> => {
  console.log('📡 Sending request:', {
    url: `${API_URL}/api/orders/status`, // เอา /api ออก
    orderShopId,
    status,
    hasToken: !!token
  });

  try {
    const response = await axios.patch(
      `${API_URL}/api/orders/status`, // เอา /api ออก
      {
        orderShopId,
        status
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    console.log('✅ Response:', response.data);
  } catch (error: any) {
    console.error("❌ updateTrackingNumber error:", error.response?.data || error.message);
    throw error;
  }
};


export interface ShopPaymentIntentForFrontend {
  shop_id: number;
  shop_name: string;
  amount: number;
  client_secret: string;
  stripe_account: string;
  order_shop_id: number;
  order_items?: any[];
}

export interface PaymentResponse {
  message: string;
  order_id: number;
  order_date: string;
  total_amount: number;
  user_info: {
    user_id: number;
    username: string;
    email: string;
  };
  total_payment_intents: number;
  paymentIntents: ShopPaymentIntentForFrontend[];
}

export const createMultiVendorPayment = async (
  token: string,
  orderId?: number
): Promise<PaymentResponse> => {
  try {
    const body: any = {};
    if (orderId && orderId !== 0) {
      body.orderId = orderId;
    }
    const response = await axios.post(
      `${API_URL}/api/payment-multivendor`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || 'ไม่สามารถสร้างการชำระเงินแบบหลายร้านได้';
    throw new Error(msg);
  }
};