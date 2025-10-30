import express, { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
dotenv.config();

const storeconnect = Router();
const prisma = new PrismaClient();

storeconnect.get(
  "/connect",
  authenticateToken,authstore,async (req: Request, res: Response): Promise<void> => {
    try {
      const { acct_id } = req.query;
      const shop_id = req.user?.shop_id;

      // ✅ ตรวจสอบค่า
      if (!acct_id || !shop_id) {
        res.status(400).json({ message: "ข้อมูลไม่ครบ" });
        return;
      }

      const acctIdStr = Array.isArray(acct_id) ? acct_id[0] : acct_id;
      const shopIdNum = typeof shop_id === "string" ? parseInt(shop_id) : shop_id;

      if (!acctIdStr || !shopIdNum) {
        res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
        return;
      }

      // ✅ อัปเดต stripe_account_id
      await prisma.shops.update({
        where: { shop_id: shopIdNum },
        data: { stripe_account_id: acctIdStr },
      });

      res.json({ message: "เชื่อมบัญชี Stripe สำเร็จ" });
    } catch (error) {
      console.error("❌ Stripe Connect Error:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการเชื่อมบัญชี Stripe" });
    }
  }
);


export default storeconnect;
