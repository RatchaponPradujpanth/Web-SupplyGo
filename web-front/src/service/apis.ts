import axios, { AxiosError } from "axios";
// import dotenv from 'dotenv'
export const API_URL = "http://192.168.1.102:5000";  


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

interface CartResponse {
  cart_id: number | null;
  items: CartItem[];
}

export const RegisterUser = async (
  username: string,
  password: string,
  email: string
): Promise<void> => {
  try {
    const response = await axios.post(`${API_URL}/api/register`, {
      username,
      password,
      email,
    });
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Register error";

    console.error("Register error:", errorMsg);
    throw new Error(errorMsg);
  }
};

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
    const response = await axios.get<Product[]>(`${API_URL}/api/loadproduct`, {
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

export const getCartSummary = async (token: string): Promise<CheckoutSummary> => {
  try {
    const response = await axios.get<CheckoutSummary>(`${API_URL}/api/cartsummary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ โหลดข้อมูลสรุปตะกร้าไม่สำเร็จ:", error.message);
    throw error;
  }
};

export type ShopPaymentIntent = {
  shop_id: number;
  shop_name: string;
  amount: number;
  client_secret: string;
  stripe_account: string;
};

export const createMultiVendorPayment = async (
  token: string,
  cartId: number
): Promise<{ paymentIntents: ShopPaymentIntent[] }> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/payment-multivendor`,
      { cartId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "ไม่สามารถสร้างการชำระเงินแบบหลายร้านได้";
    throw new Error(msg);
  }
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
  imageFile: File
): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append("product_name", product_name);
    formData.append("product_description", product_description);
    formData.append("price", price.toString());
    formData.append("category_id", category_id.toString());
    formData.append("image", imageFile); // ต้องใช้ชื่อ 'image' ตรงกับ backend

    const response = await axios.post(`${API_URL}/api/add-product`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("✅ เพิ่มสินค้าสำเร็จ", response.data);
  } catch (error) {
    console.error("❌ error ที่ api:");
    throw error;
  }
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await axios.get<Category[]>(`${API_URL}/api/categories`);
    return response.data;
  } catch (error) {
    console.error("❌ ดึง category ไม่สำเร็จ:", error);
    return [];
  }
};

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

export const loaduserproduct = async (): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/api/loaduserproduct`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Products fetched:", response.data);
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Failed to load products";

    console.error("Error fetching products:", errorMsg);
    throw new Error(errorMsg);
  }
};

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

export async function addtocart(product_id: number, quantity: number) {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.post(
      `${API_URL}/api/addtocart`,
      { product_id, quantity },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data; // ข้อมูลที่ backend ตอบกลับ
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message || err.message || "Add to cart failed";

    console.error("Add to cart error:", errorMsg);
    throw new Error(errorMsg);
  }
}