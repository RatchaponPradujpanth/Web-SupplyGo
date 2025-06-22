import express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
        // ถ้ามี field อื่น ๆ ใน token ก็เพิ่มตรงนี้
      };
    }
  }
}