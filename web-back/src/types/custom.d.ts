import express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
        role: string;
        shop_id:number;
      };
    }
  }
}