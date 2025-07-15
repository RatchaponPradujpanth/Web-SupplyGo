import express, { Request, Response, Router, NextFunction } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { pool } from "../config/db";
import { authenticateToken, authstore } from "../middleware/authMiddleware";

dotenv.config();

const storeregisstripe = Router();

// ✅ สร้าง instance ของ Stripe (ใช้ร่วมกัน)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
});

// ✅ Route: POST /api/regisstripe
storeregisstripe.post(
  "/regisstripe",
  authenticateToken,
  authstore,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // ✅ ดึงข้อมูลจาก token ที่ถอดรหัสไว้ใน middleware
      const user = req.user as { user_id: number; shop_id: number; role: string };
      const shopId = user.shop_id;

      // ✅ สร้าง Stripe Account แบบ Standard ให้ร้านค้า
      const account = await stripe.accounts.create({ type: "standard" });

      // ✅ สร้างลิงก์สำหรับ onboarding ให้ร้านค้ากรอกข้อมูล
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: "http://localhost:3000/connect/reauth", // กลับมาที่นี่ถ้ากรอกไม่ครบ
        return_url: `http://localhost:3000/connect/complete?acct_id=${account.id}&shop_id=${shopId}`,
        type: "account_onboarding",
      });

      // ✅ ส่งลิงก์ให้ frontend ไปเปิดให้ร้านค้า
      res.status(200).json({ url: accountLink.url });
    } catch (err) {
      console.error("❌ สร้างบัญชี Stripe ไม่สำเร็จ:", err);
      res.status(500).send("สร้างบัญชีไม่สำเร็จ");
    }
  }
);

export default storeregisstripe;
