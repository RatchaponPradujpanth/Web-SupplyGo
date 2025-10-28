import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export class ResponseHandler {
  static success<T>(res: Response, message: string, data?: T, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    res.status(statusCode).json(response);
  }

  static error(res: Response, message: string, error?: string, statusCode: number = 500): void {
    const response: ApiResponse = {
      success: false,
      message,
      error,
    };
    res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string, error?: string): void {
    this.error(res, message, error, 400);
  }

  static unauthorized(res: Response, message: string = 'ไม่มีสิทธิ์เข้าถึง'): void {
    this.error(res, message, undefined, 401);
  }

  static forbidden(res: Response, message: string = 'ไม่อนุญาตให้เข้าถึง'): void {
    this.error(res, message, undefined, 403);
  }

  static notFound(res: Response, message: string = 'ไม่พบข้อมูล'): void {
    this.error(res, message, undefined, 404);
  }

  static created<T>(res: Response, message: string, data?: T): void {
    this.success(res, message, data, 201);
  }
}
