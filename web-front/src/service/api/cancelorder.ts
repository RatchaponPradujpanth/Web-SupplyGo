import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface cancelledorderResponse{
    status : string
}

export const cancelorder = async (token : string , orderId : number):Promise<cancelledorderResponse> => {
    if (!token) throw new Error("No token provided");

    try {
        const response = await axios.post(
            `${API_URL}/api/cancelorder/${orderId}`,
            {}, // body ว่าง
            {
                headers : {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

    const data: cancelledorderResponse = response.data;

    if (data.status) {
      console.log(`Order ${orderId} status updated:`, data.status);
    } else {
      console.warn(`Payment not completed for order ${orderId}:`, data.status);
    }
    return data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    } else {
      console.error("Unexpected error:", error);
      throw new Error("Unexpected error");
    }
}
}