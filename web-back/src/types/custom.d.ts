import express from "express";
import multer from "multer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
        role: string;
        shop_id: number;
      };
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}
