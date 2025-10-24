import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const updatestatusRoute = Router();
const prisma = new PrismaClient();

updatestatusRoute.post("/update-status", authenticateToken, authstore, async (req: Request, res: Response) => {
  try {
    const { product_id, status } = req.body;

    // ตรวจสอบค่าที่ส่งมา
    if (!product_id || !status) {
    res.status(400).json({ message: "product_id และ status ต้องระบุ" });
    return
}

    // อัปเดต status ในฐานข้อมูล
    const updatedProduct = await prisma.products.update({
      where: { product_id: Number(product_id) },
      data: {
        status,
        updated_date: new Date(), // อัปเดตวันที่ล่าสุด
      },
    });

    res.status(200).json({ message: "อัปเดตสถานะสินค้าสำเร็จ", product: updatedProduct });
  } catch (error: any) {
    console.error(error);

    // ตรวจสอบกรณีสินค้าไม่เจอ
    if (error.code === "P2025") {
    res.status(404).json({ message: "ไม่พบสินค้านี้" });
    return
    }
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ", error: error.message });
    return
}
});

export default updatestatusRoute;
