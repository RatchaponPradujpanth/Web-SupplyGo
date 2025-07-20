import axios, { AxiosError } from "axios";



export const API_URL = "http://192.168.1.133:5000";  

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
  username :string,
  password :string,
  email : string
): Promise<void> =>{
   try{
    const response = await axios.post(`${API_URL}/api/register`, {
      username,
      password,
      email
    });
    

   }catch
     (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    const errorMsg =
      err.response?.data?.message ||
      err.message ||
      "Register error";

    console.error("Register error:", errorMsg);
    throw new Error(errorMsg);
   }
}


export const loginUser = async (
  username: string,
  password: string,
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

    localStorage.setItem('token', token);  // เก็บ token ตรงนี้เลย

    return token;
  } catch (error: unknown) {
    // handle error
    throw error;
  }
};

//local
//ต้องมาอ่านอีกรอบ
export const loadUsername = async (token: string): Promise<string> => {
  try {
    const response = await axios.get<{ username: string }>(`${API_URL}/api/loadusername`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.username;
  } catch (error) {
    console.error("Load username error:", error);
    throw error;
  }
};

export const loadproduct = async (token: string): Promise<Product[]> => {
  if (!token) throw new Error('No token provided');
  try {
    const response = await axios.get<Product[]>(`${API_URL}/api/loadproduct`, {
      headers: {
        Authorization: `Bearer ${token}`,
        // ถ้าไม่ใช้ token ก็ไม่ต้องใส่ Authorization
      },
    });

    console.log("✅ Products fetched:", response.data);
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
   const errorMsg =
  err.response?.data?.message ||
  err.message ||
  "Failed to load products";

// ✅ ถ้าแค่ไม่มีสินค้า ก็ return [] ไปเลย
if (errorMsg === "No products found") {
  console.warn("⚠️ No products found, returning empty list.");
  return [];
}

console.error("Error fetching products:", errorMsg);
throw new Error(errorMsg);
  }
};

export const loadstorename = async (token: string): Promise<{ shopname: string; shop_id: number; stripe_account_id?: string | null  }> => {
  console.log("📦 loading store with token:", token); // 👈 ตรวจ token
  const response = await axios.get<{ shopname: string,shop_id: number }>(`${API_URL}/api/loadstorename`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log("✅ ได้ชื่อร้าน:", response.data.shopname); 
  return response.data;
};


export const regisstripe = async (token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/regisstripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error("เกิดข้อผิดพลาดระหว่างสร้างบัญชี Stripe");
    }

    const data = await response.json();

    if (data.url) {
      console.log("🔗 ไปยัง Stripe:", data.url);
      window.location.href = data.url; // 👈 เปลี่ยนหน้าไปยังลิงก์ onboarding
    } else {
      throw new Error("ไม่ได้รับลิงก์จาก Stripe");
    }

  } catch (error: any) {
    console.error("❌ Stripe register error:", error.message);
    throw error;
  }
};

export const confirmStripeConnect = async (acct_id: string, shop_id: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/api/connect?acct_id=${acct_id}&shop_id=${shop_id}`, {
      method: "GET",
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || "เกิดข้อผิดพลาดในการเชื่อมบัญชี Stripe");
    }

    return text; // เช่น "เชื่อมบัญชี Stripe สำเร็จ"
  } catch (error: any) {
    console.error("❌ Stripe connect confirm error:", error.message);
    throw error;
  }
};

export const cartUser = async (token: string): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // ต้องใส่ token
      },
    });

    if (!response.ok) {
      throw new Error('โหลดตะกร้าไม่สำเร็จ');
    }

    const data: CartResponse = await response.json();
    return data;

  } catch (error: any) {
    console.error("❌ โหลดตะกร้าไม่ได้:", error.message);
    throw error;
  }
};

export const getCartSummary = async (token: string): Promise<CheckoutSummary> => {
  try {
    const response = await fetch(`${API_URL}/api/cartsummary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('โหลดข้อมูลสรุปตะกร้าไม่สำเร็จ');
    }

    const data: CheckoutSummary = await response.json();
    return data;
  } catch (error: any) {
    console.error("❌ โหลดข้อมูลสรุปตะกร้าไม่สำเร็จ:", error.message);
    throw error;
  }
};


// service/apis.ts
export type ShopPaymentIntent = {
  shop_id: number;
  client_secret: string;
};

export const createMultiVendorPayment = async (
  token: string,
  cartId: number
): Promise<{ paymentIntents: ShopPaymentIntent[] }> => {
  const response = await fetch(`${API_URL}/api/payment-multivendor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cartId }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'ไม่สามารถสร้างการชำระเงินแบบหลายร้านได้');
  }

  return response.json(); // ได้ { paymentIntents: [...] }
};

export async function uploadImages(images: File[]) {
  console.log('🚀 [uploadImages] เริ่มส่งไฟล์จำนวน:', images.length);
  const formData = new FormData();
  images.forEach(file => {
    console.log('  - เตรียมส่งไฟล์:', file.name);
    formData.append('images', file);
  });

  try {
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log('📡 [uploadImages] Response status:', res.status);

    if (!res.ok) {
      const error = await res.json();
      console.error('❌ [uploadImages] Error response:', error);
      throw new Error(error.message || 'อัปโหลดล้มเหลว');
    }

    const data = await res.json();
    console.log('✅ [uploadImages] Response data:', data);
    return data;

  } catch (err) {
    console.error('🔥 [uploadImages] Fetch failed:', err);
    throw err;
  }
}


export const addproduct = async (
  token:string,
  product_name : string,
  product_description : string , 
  price : number,
  category_id : number,
  imageFile : File
):Promise<void> =>{
  try {
    const formData = new FormData();
    formData.append('product_name', product_name);
    formData.append('product_description', product_description);
    formData.append('price', price.toString());
    formData.append('category_id', category_id.toString());
    formData.append('image', imageFile); // ต้องใช้ชื่อ 'image' ตรงกับ backend


    const response = await axios.post(`${API_URL}/api/add-product`,formData,{
      headers: {
        Authorization: `Bearer ${token}`,
        // ถ้าไม่ใช้ token ก็ไม่ต้องใส่ Authorization
      }, 
    });
    console.log("✅ เพิ่มสินค้าสำเร็จ", response.data);
  } catch (error) {
    console.error("❌ error ที่ api:");
}
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/categories`);
    return response.data;
  } catch (error) {
    console.error('❌ ดึง category ไม่สำเร็จ:', error);
    return [];
  }
};