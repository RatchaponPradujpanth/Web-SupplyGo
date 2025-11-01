import { Router, Request, Response } from 'express';
import { authadmin, authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient } from "@prisma/client";

const updatecategoryRoute = Router();
const prisma = new PrismaClient();

// อัปเดตประเภทสินค้า
updatecategoryRoute.put("/categories/:id", authenticateToken, authadmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { category_name, description } = req.body;

  try {
    const categoryId = parseInt(id);

    // ตรวจสอบว่าประเภทสินค้ามีอยู่จริงหรือไม่
    const existingCategory = await prisma.product_categories.findUnique({
      where: { category_id: categoryId }
    });

    if (!existingCategory) {
      res.status(404).json({ message: "ไม่พบประเภทสินค้า" });
      return;
    }

    // อัปเดตประเภทสินค้า
    const updatedCategory = await prisma.product_categories.update({
      where: { category_id: categoryId },
      data: {
        category_name,
        description,
      }
    });

    res.status(200).json({
      message: "อัปเดตประเภทสินค้าสำเร็จ",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("อัปเดตประเภทสินค้าไม่สำเร็จ:", error);
    res.status(500).json({ message: "อัปเดตประเภทสินค้าไม่สำเร็จ" });
  }
});

// ลบประเภทสินค้า
updatecategoryRoute.delete("/categories/:id", authenticateToken, authadmin, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const categoryId = parseInt(id);

    // ตรวจสอบว่าประเภทสินค้ามีอยู่จริงหรือไม่
    const existingCategory = await prisma.product_categories.findUnique({
      where: { category_id: categoryId }
    });

    if (!existingCategory) {
      res.status(404).json({ message: "ไม่พบประเภทสินค้า" });
      return;
    }

    // ตรวจสอบว่ามีสินค้าใช้ประเภทนี้อยู่หรือไม่
    const productsCount = await prisma.products.count({
      where: { category_id: categoryId }
    });

    if (productsCount > 0) {
      res.status(400).json({ 
        message: `ไม่สามารถลบได้ เนื่องจากมีสินค้า ${productsCount} รายการใช้ประเภทนี้อยู่` 
      });
      return;
    }

    // ลบประเภทสินค้า
    await prisma.product_categories.delete({
      where: { category_id: categoryId }
    });

    res.status(200).json({
      message: "ลบประเภทสินค้าสำเร็จ",
    });
  } catch (error) {
    console.error("ลบประเภทสินค้าไม่สำเร็จ:", error);
    res.status(500).json({ message: "ลบประเภทสินค้าไม่สำเร็จ" });
  }
});

export default updatecategoryRoute;
