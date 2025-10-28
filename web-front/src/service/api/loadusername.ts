import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


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