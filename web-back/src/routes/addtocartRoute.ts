import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/authMiddleware";

const addtocartRoute = Router();
const prisma = new PrismaClient();

addtocartRoute.post("/addtocart", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { product_id, quantity, variant_id, option_value_id } = req.body;
  const userId = req.user?.user_id;
// console.log("📥 รับข้อมูลจาก client:", {
//   product_id,
//   quantity,
//   variant_id,
//   option_value_id,
// });
  if (!userId || typeof userId !== "number") {
    res.status(401).json({ error: "ผู้ใช้ไม่ได้เข้าสู่ระบบหรือ user_id ไม่ถูกต้อง" });
    return;
  }

  if (!product_id || !quantity) {
    res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน: ต้องมี product_id และ quantity" });
    return;
  }

  if (option_value_id !== undefined && !Array.isArray(option_value_id)) {
    res.status(400).json({ error: "option_value_id ต้องเป็น array หรือ undefined" });
    return;
  }

  try {
    // หา cart หรือสร้างใหม่
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

    let shop_id: number;
    let price: number;

    if (variant_id) {
  const result = await prisma.$transaction(async (tx) => {
    console.log("🔍 ตรวจสอบ variant_id:", variant_id);

    const variant = await tx.product_variants.findUnique({
      where: { variant_id },
      include: {
        product: {
          select: {
            status: true,
            product_owners: { select: { shop_id: true } },
          },
        },
      },
    });

    if (!variant) throw new Error("ไม่พบ variant");

    console.log("✅ เจอ variant:", variant);

    if (variant.stock_quantity !== null && quantity > variant.stock_quantity) {
      throw new Error("จำนวนสินค้าเกินจำนวนในสต็อก");
    }

    if (variant.product.status !== "active") {
      throw new Error("สินค้าไม่พร้อมจำหน่าย");
    }

    shop_id = variant.product.product_owners?.[0]?.shop_id;
    price = variant.price ? variant.price.toNumber() : 0;

    const newCartItem = await tx.cart_items.create({
      data: {
        cart_id: cart.cart_id,
        product_id,
        shop_id,
        variant_id,
        quantity,
        price_per_unit: price,
      },
    });

    console.log("🛒 เพิ่ม cart_items แล้ว:", newCartItem);

    if (option_value_id && Array.isArray(option_value_id) && option_value_id.length > 0) {
      console.log("📦 มี option_value_id:", option_value_id);

      const validOptions = await tx.variant_options.findMany({
        where: {
          variant_option_id: { in: option_value_id },
          variant_id: variant_id,
        },
      });

      console.log("✅ ตรวจสอบแล้ว validOptions:", validOptions);

      if (validOptions.length !== option_value_id.length) {
        throw new Error("มี option_value_id ที่ไม่ถูกต้อง");
      }

      const junctionData = option_value_id.map((optionId) => ({
        cart_item_id: newCartItem.cart_item_id,
        variant_option_id: optionId,
      }));

      console.log("🧷 เตรียม insert ไป cart_item_variant_options:", junctionData);

      const inserted = await tx.cart_item_variant_options.createMany({
        data: junctionData,
      });

      console.log("📥 บันทึก cart_item_variant_options แล้ว:", inserted);
    } else {
      console.log("❕ ไม่มี option_value_id ส่งมา");
    }

    return newCartItem;
  });

  res.status(201).json({
    message: "เพิ่มสินค้าลงตะกร้าสำเร็จ (variant)",
    cart_item: result,
    debug: {
      variant_id,
      option_value_id,
      options_count: option_value_id?.length || 0,
    },
  });
}
    else {
      // กรณีสินค้าธรรมดาไม่มี variant
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
        res.status(400).json({ error: "ไม่พบสินค้าหรือราคาสินค้าเป็น null" });
        return;
      }

      if (productData.status !== "active") {
        res.status(400).json({ error: "สินค้าไม่พร้อมจำหน่าย" });
        return;
      }

      shop_id = productData.product_owners?.[0]?.shop_id;
      if (!shop_id) {
        res.status(400).json({ error: "ไม่พบร้านเจ้าของสินค้านี้" });
        return;
      }
      
      price = productData.price.toNumber();

      // เพิ่มลงตะกร้า กรณีไม่มี variant
      const newCartItem = await prisma.cart_items.create({
        data: {
          cart_id: cart.cart_id,
          product_id,
          shop_id,
          quantity,
          price_per_unit: price,
        },
      });

      res.status(201).json({ message: "เพิ่มสินค้าลงตะกร้าสำเร็จ (ธรรมดา)", cart_item: newCartItem });
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเพิ่มลงตะกร้า:", error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

export default addtocartRoute;