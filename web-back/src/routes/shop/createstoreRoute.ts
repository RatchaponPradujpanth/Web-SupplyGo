import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const createstoreRoute = Router();
const prisma = new PrismaClient();

createstoreRoute.post(
  '/create-store',
  authenticateToken,
  authstore,
  async (req: Request, res: Response) => {
    try {
      // ✅ ดึงข้อมูล user จาก token
      const user = req.user as { user_id: number; shop_id?: number; role: string };
      if (!user) {res.status(401).json({ message: 'Unauthorized' });
        return}
      // ✅ รับข้อมูลร้านจาก body
      const { shop_name, address } = req.body;

      if (!shop_name) {
        res.status(400).json({ message: 'กรุณากรอกชื่อร้านค้า' });
        return
      }

      // ✅ สร้างร้านใหม่ใน table shops
      const newShop = await prisma.shops.create({
        data: {
          shop_name,
          address: address || null,
          user_id: user.user_id,
        },
      });

      res.status(201).json({
        message: 'สร้างร้านค้าสำเร็จ',
        shop: newShop,
      });
    } catch (error: any) {
      console.error('❌ Create store error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างร้านค้า' });
    }
  }
);

export default createstoreRoute;
