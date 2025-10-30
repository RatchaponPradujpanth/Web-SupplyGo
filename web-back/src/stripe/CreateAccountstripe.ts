import express, { Request, Response, Router, NextFunction } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { authenticateToken, authstore } from "../middleware/authMiddleware";

dotenv.config();

const storeregisstripe = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

// POST /api/regisstripe
storeregisstripe.post(
  "/regisstripe",
  authenticateToken,
  authstore,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as { user_id: number; shop_id: number; role: string };
      const shopId = user.shop_id;
      const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL;

      // สร้าง Stripe Account แบบ Standard
      const account = await stripe.accounts.create({ type: "standard" });

      // ✅ สร้างลิงก์ onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        // ไม่ต้องใช้ refresh_url
        refresh_url: `${FRONTEND_URL}/store/dashboard`, 
        return_url: `${FRONTEND_URL}/connect/complete?acct_id=${account.id}&shop_id=${shopId}`,
        type: "account_onboarding",
      });

      res.status(200).json({ url: accountLink.url });
    } catch (err) {
      console.error("❌ สร้างบัญชี Stripe ไม่สำเร็จ:", err);
      // ถ้าสมัครไม่ผ่าน หรือ error ให้ redirect ไปหน้า dashboard เลย
      res.status(200).json({ url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/store/dashboard` });
    }
  }
);

export default storeregisstripe;
