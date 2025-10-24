import { Router, Request, Response } from "express";
import { authadmin, authenticateToken } from "../../middleware/authMiddleware"; 
import { PrismaClient } from "@prisma/client";

const paymenthistoryRoute = Router();
const prisma = new PrismaClient();

paymenthistoryRoute.get(
  "/payment-history",
  authenticateToken,
  authadmin,
  async (req: Request, res: Response) => {
    try {
      // ดึงประวัติการชำระเงินทั้งหมด
      const paymentHistory = await prisma.order.findMany({
        orderBy: { order_date: "desc" },
        include: {
          users: true, // ข้อมูล user
          order_shops: {
            include: {
              shops: true, // ข้อมูลร้านค้า
              order_items: {
                include: {
                  products: true, // ข้อมูลสินค้า
                  variant_option: true // ถ้ามี variant
                },
              },
            },
          },
          address: true, // ข้อมูลที่อยู่
        },
      });

       res.status(200).json({success: true,data: paymentHistory,});
       return
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment history",
      });
      return;
    }
  }
);

export default paymenthistoryRoute;
