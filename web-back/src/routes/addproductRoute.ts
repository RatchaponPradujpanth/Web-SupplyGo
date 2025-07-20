import { Router, Request, Response } from "express";
import uploadProductImage from "../middleware/uploadProductImage";
import { pool } from "../config/db";
import { authenticateToken } from "../middleware/authMiddleware";

const addproductRoute = Router();

addproductRoute.post(
  '/add-product',
  authenticateToken,
  uploadProductImage.single('image'),
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
        res.status(400).json({ message: "คุณไม่มีสิทธิ" });
        return
      }

      // INSERT สินค้า
      const productResult = await pool.query(
        `INSERT INTO products (product_name, price, product_description, category_id, image)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING product_id`,
        [product_name, price, product_description, category_id, image]
      );

      const product_id = productResult.rows[0].product_id;
      console.log("✅ เพิ่มสินค้าใน products แล้ว ได้ product_id:", product_id);

      // INSERT ความเป็นเจ้าของสินค้า
      await pool.query(
        `INSERT INTO product_owners (shop_id, product_id) VALUES ($1, $2)`,
        [user.shop_id, product_id]
      );
      console.log("✅ บันทึกเจ้าของสินค้าใน product_owners แล้ว");

      res.status(201).json({ message: "เพิ่มสินค้าสำเร็จ" });
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดขณะเพิ่มสินค้า:", error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะเพิ่มสินค้า' });
    }
  }
);

export default addproductRoute;
