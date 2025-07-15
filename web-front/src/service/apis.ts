import axios, { AxiosError } from "axios";


export const API_URL = "http://192.168.1.133:5000";  



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

export const loadproduct = async (): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_URL}/api/loadproduct`, {
      headers: {
        'Content-Type': 'application/json',
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