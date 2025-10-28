import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

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