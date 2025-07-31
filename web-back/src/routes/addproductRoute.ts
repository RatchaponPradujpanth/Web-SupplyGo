import { Router, Request, Response } from "express";
import uploadProductImage from "../middleware/uploadProductImage";
import { authenticateToken } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const addproductRoute = Router();
const prisma = new PrismaClient();

addproductRoute.post(
  "/add-product",
  authenticateToken,
  uploadProductImage.single("image"),
  async (req: Request, res: Response) => {
    try {
      console.log("🟢 [API] เริ่มเพิ่มสินค้า");

      const { product_name, product_description, price, category_id } = req.body;
      const image = req.file ? `/upload/products/${req.file.filename}` : null;
      const user = req.user as { user_id: number; shop_id: number; role: string };

      console.log("📦 ข้อมูลจาก req.body:", req.body);
      console.log("🖼️ รูปภาพที่อัปโหลด:", req.file);
      console.log("👤 ผู้ใช้งานที่ login:", user);

      if (user.role !== "store") {
        console.warn("⛔️ สิทธิ์ไม่เพียงพอ: ผู้ใช้ไม่ใช่ร้านค้า");
        res.status(403).json({ message: "คุณไม่มีสิทธิในการเพิ่มสินค้า" });
        return;
      }

      // ✅ สร้างสินค้าในตาราง products
      const newProduct = await prisma.products.create({
        data: {
          product_name,
          product_description,
          price: parseFloat(price).toFixed(2), // แปลงจาก string → number
          category_id: parseInt(category_id),
          image,
        },
      });

      console.log("✅ เพิ่มสินค้าใน products แล้ว:", newProduct.product_id);

      // ✅ ผูกเจ้าของสินค้าใน product_owners
      await prisma.product_owners.create({
        data: {
          shop_id: user.shop_id,
          product_id: newProduct.product_id,
        },
      });

      console.log("✅ บันทึกเจ้าของสินค้าใน product_owners แล้ว");

      res.status(201).json({ message: "เพิ่มสินค้าสำเร็จ" });
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดขณะเพิ่มสินค้า:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดขณะเพิ่มสินค้า" });
    }
  }
);

export default addproductRoute;
