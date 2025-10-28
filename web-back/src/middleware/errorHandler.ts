import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/responseHandler';

export class ErrorHandler {
  static async catchAsync(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        console.error('❌ Error:', error);
        
        if (error instanceof Error) {
          ResponseHandler.error(res, 'เกิดข้อผิดพลาด', error.message);
        } else {
          ResponseHandler.error(res, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        }
      }
    };
  }

  static handle(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error('❌ Unhandled Error:', err);
    ResponseHandler.error(res, 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', err.message);
  }
}
