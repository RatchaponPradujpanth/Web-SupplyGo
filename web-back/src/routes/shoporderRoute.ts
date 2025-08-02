import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const shoporderRoute = Router();
const prisma = new PrismaClient();

/**
 * GET /shoporderhistory
 * ดึงประวัติคำสั่งซื้อร้านค้า พร้อมกรองเลขพัสดุ (tracking_number) ได้
 */
shoporderRoute.get("/shoporderhistory", authenticateToken, authstore, async (req: Request, res: Response): Promise<void> => {
  const shopId = req.user?.shop_id;
  const trackingNumberFilter = req.query.tracking_number?.toString();

  try {
    const findordershop = await prisma.order_shops.findMany({
      where: {
        shop_id: shopId,
        ...(trackingNumberFilter && {
          tracking_number: {
            contains: trackingNumberFilter,
            mode: "insensitive",
          },
        }),
      },
      select: {
        order_shop_id: true,
        shop_id: true,
        subtotal: true,
        status: true,
        tracking_number: true,
        order_id: true,
      },
    });

    if (findordershop.length === 0) {
      res.json({ orders: [], order_shops: [], order_items: [], addresses: [] });
      return;
    }

    const maporderid = findordershop.map(order => order.order_id);
    const findorderaddress = await prisma.order.findMany({
      where: {
        order_id: { in: maporderid },
      },
      select: {
        order_id: true,
        address_id: true,
        user_id: true,
      },
    });

    const mapordershopid = findordershop.map(o => o.order_shop_id);
    const mapaddressid = [...new Set(findorderaddress.map(o => o.address_id))];

    const findorderitem = await prisma.order_items.findMany({
      where: { order_shop_id: { in: mapordershopid } },
      select: {
        order_shop_id: true,
        product_id: true,
        quantity: true,
        price_per_unit: true,
        total_price: true,
      },
    });

    const findaddressdetail = await prisma.address.findMany({
      where: {
        address_id: { in: mapaddressid },
      },
      select: {
        address_id: true,
        firstname: true,
        lastname: true,
        phone_number: true,
        house_number: true,
        street: true,
        sub_district: true,
        district: true,
        province: true,
        postal_code: true,
      },
    });

    res.json({
      orders: findorderaddress,
      order_shops: findordershop,
      order_items: findorderitem,
      addresses: findaddressdetail,
    });
  } catch (error) {
    console.error("❌ Error loading shop orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


/**
 * GET /orders
 * ดึงรายการออเดอร์สั้นๆ ของร้าน (รวม order + items)
 */
shoporderRoute.get("/orders", authenticateToken, authstore, async (req: Request, res: Response): Promise<void> => {
  const shopId = req.user?.shop_id;
  if (!shopId) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const orders = await prisma.order_shops.findMany({
      where: { shop_id: shopId },
      include: {
        order: true,
        order_items: { include: { products: true } },
      },
    });

    res.json(orders);
  } catch (err) {
    console.error("❌ ดึงข้อมูลล้มเหลว:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


/**
 * PATCH /orders/tracking
 * อัปเดตเลขพัสดุสำหรับ order_shop ที่ร้านเป็นเจ้าของ
 */
shoporderRoute.patch("/orders/tracking", authenticateToken, authstore, async (req: Request, res: Response): Promise<void> => {
  console.log("🎯 PATCH /orders/tracking called");
  console.log("📝 Request body:", req.body);
  console.log("👤 User from token:", req.user);

  const { orderShopId, trackingNumber } = req.body;
  const shopId = req.user?.shop_id;

  if (!orderShopId || !trackingNumber || trackingNumber.trim() === "") {
    console.log("❌ Missing required fields");
    res.status(400).json({ error: "orderShopId และ trackingNumber ต้องถูกส่งมา" });
    return;
  }

  try {
    console.log("🔄 Updating order_shop_id:", orderShopId, "for shop_id:", shopId);
    
    const result = await prisma.order_shops.updateMany({
      where: {
        order_shop_id: Number(orderShopId),
        shop_id: shopId,
      },
      data: {
        tracking_number: trackingNumber.trim(),
      },
    });

    console.log("📊 Update result:", result);

    if (result.count === 0) {
      console.log("❌ No records updated");
      res.status(404).json({ error: "Order not found or unauthorized" });
      return;
    }

    console.log("✅ Tracking number updated successfully");
    res.json({ message: "อัปเดตเลขพัสดุเรียบร้อย" });
  } catch (err) {
    console.error("❌ อัปเดตเลขพัสดุล้มเหลว:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default shoporderRoute;