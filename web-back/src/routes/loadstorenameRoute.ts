import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const loadstorename = Router();
const prisma = new PrismaClient();

loadstorename.get(
  "/loadstorename",
  authenticateToken,
  authstore,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const shopId = req.user?.shop_id;

      if (!shopId) {
        res.status(400).json({ message: "Shop ID not found in token" });
        return
      }

      // ดึงข้อมูลร้านพร้อม wallet
      const shopData = await prisma.shops.findUnique({
        where: { shop_id: shopId },
        include: { wallets: true }, // relation ชื่อ wallets ตาม schema
      });

      if (!shopData) {
         res.status(404).json({ message: "Shop not found" });
         return
      }

      // รวม points เข้าเป็น property ตรง ๆ
      const responseData = {
        shop_id: shopData.shop_id,
        shop_name: shopData.shop_name,
        stripe_account_id: shopData.stripe_account_id,
        points: shopData.wallets?.points ?? 0, // ถ้า wallet ยังไม่มี ให้ 0
      };

      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error loading shopname:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default loadstorename;
