import axios, { AxiosError } from "axios";

export const API_URL = "http://10.5.50.48:5000";  



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
    const response = await fetch('http://localhost:5000/api/loadproduct', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // ถ้าไม่ใช้ token แล้ว ลบ Authorization ออกได้
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No products found');
      }
      throw new Error('Failed to load products');
    }

    const data: Product[] = await response.json();
    console.log("✅ Products fetched:", data);
    return data;

  } catch (error: any) {
    console.error('Error fetching products:', error);
    throw new Error(error.message || 'Something went wrong');
  }
};