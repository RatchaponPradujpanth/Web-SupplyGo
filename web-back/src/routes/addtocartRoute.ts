import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/authMiddleware";

const addtocartRoute = Router();
const prisma = new PrismaClient();

addtocartRoute.post("/addtocart", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { product_id, quantity } = req.body;
  const userId = req.user?.user_id;

  if (!userId || typeof userId !== "number") {
    res.status(401).json({ error: "ผู้ใช้ไม่ได้เข้าสู่ระบบหรือ user_id ไม่ถูกต้อง" });
    return;
  }

  try {
    // หา cart ของ user หรือสร้างใหม่
    let cart = await prisma.cart.findUnique({
      where: { user_id: userId },
      select: { cart_id: true },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId },
        select: { cart_id: true },
      });
    }

    // ดึงข้อมูลสินค้าและเจ้าของร้าน
    const productData = await prisma.products.findUnique({
      where: { product_id },
      select: {
        price: true,
        status: true,
        product_owners: {
          select: {
            shop_id: true,
          },
        },
      },
    });

    if (!productData || productData.price === null) {
      res.status(404).json({ error: "ไม่พบสินค้าหรือราคาสินค้าเป็น null" });
      return;
    }

    if (productData.status !== "active") {
      res.status(400).json({ error: "สินค้าไม่พร้อมจำหน่าย" });
      return;
    }

    // เอา shop_id ตัวแรกจาก product_owners
    const shop_id = productData.product_owners?.[0]?.shop_id;

    if (!shop_id) {
      res.status(400).json({ error: "ไม่พบร้านเจ้าของสินค้านี้" });
      return;
    }

    // เพิ่มลงตะกร้า
    await prisma.cart_items.create({
      data: {
        cart_id: cart.cart_id,
        product_id,
        shop_id,
        quantity,
        price_per_unit: productData.price,
      },
    });

    res.status(201).json({ message: "เพิ่มสินค้าในตะกร้าเรียบร้อย" });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเพิ่มลงตะกร้า:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


export default addtocartRoute;
