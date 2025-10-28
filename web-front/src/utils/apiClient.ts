import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosProgressEvent } from 'axios';

/**
 * Base API Client สำหรับจัดการ HTTP requests
 */
class ApiClient {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - เพิ่ม auth token ถ้ามี
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - จัดการ errors
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired หรือ unauthorized
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance.get(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'GET', url);
      throw error;
    }
  }

  /**
   * POST request
   */
  async post<T = unknown, D = unknown>(
    url: string, 
    data?: D, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'POST', url);
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put<T = unknown, D = unknown>(
    url: string, 
    data?: D, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'PUT', url);
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'DELETE', url);
      throw error;
    }
  }

  /**
   * Upload file
   */
  async upload<T = unknown>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'UPLOAD', url);
      throw error;
    }
  }

  /**
   * Handle and log errors
   */
  private handleError(error: unknown, method: string, url: string): void {
    console.error(`❌ [${method}] ${url}:`, error);
    
    if (axios.isAxiosError(error)) {
      console.error('🧾 Response status:', error.response?.status);
      console.error('🧾 Response data:', error.response?.data);
    }
  }

  /**
   * Get base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;