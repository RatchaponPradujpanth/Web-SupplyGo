import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient } from "@prisma/client";

const savetransactionRoute = Router();
const prisma = new PrismaClient();

savetransactionRoute.post("/save-transaction", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log("POST /api/save-transaction called", req.body);
  try {
    const userId = req.user?.user_id;
    let { shopId, orderShopId, paymentIntentId } = req.body;

    // แปลง shopId, orderShopId เป็น number ถ้าจำเป็น (กรณีส่งมาเป็น string)

    // เช็คข้อมูลครบถ้วนและถูกต้อง
     if (!userId || !shopId || !orderShopId || !paymentIntentId) {
      res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
      return 
    }
    // หา order_shops โดยตรวจสอบว่า order นั้นเป็นของ user นี้จริง
    const orderShop = await prisma.order_shops.findFirst({
      where: {
        order_shop_id: orderShopId,
        shop_id: shopId,
        order: {
          user_id: userId
        }
      }
    });

    if (!orderShop) {
      res.status(404).json({ message: "ไม่พบข้อมูล order_shops หรือไม่มีสิทธิ์เข้าถึง" });
      return;
    }

    // อัปเดต transaction_id และ charge_id
    await prisma.order_shops.update({
      where: { order_shop_id: orderShopId },
      data: {
        transaction_id: paymentIntentId,
      }
    });

    res.json({ message: "บันทึกข้อมูลการชำระเงินสำเร็จ" });
  } catch (error) {
    console.error("❌ save-transaction error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});


export default savetransactionRoute;
