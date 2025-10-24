import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const shoporderRoute = Router();
const prisma = new PrismaClient();

/**
 * GET /shoporderhistory
 */
shoporderRoute.get("/shoporderhistory", authenticateToken, authstore, async (req: Request, res: Response) => {
  const shopId = req.user?.shop_id;
  const trackingNumberFilter = req.query.tracking_number?.toString();

  console.log("🔹 GET /shoporderhistory called");
  console.log("Shop ID:", shopId);
  console.log("Query params:", req.query);

  if (!shopId) {
     res.status(403).json({ error: "Unauthorized" });
     return;
  }

  const protocol = req.protocol;
  const host = req.headers.host;

  const getFullUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${protocol}://${host}${path.startsWith("/") ? path : "/" + path}`;
  };

  try {
    const normalOrders = await prisma.order_shops.findMany({
      where: {
        shop_id: shopId,
        status: "paid",
        ...(trackingNumberFilter && {
          tracking_number: {
            contains: trackingNumberFilter,
            mode: "insensitive",
          },
        }),
      },
      include: {
        order: {
          include: {
            users: true,
            address: true,
          },
        },
        order_items: {
          include: {
            products: { include: { product_images: true } },
            variant_option: { include: { option: true } },
          },
        },
      },
    });


    // แปลง normalOrders ให้รวมรูปภาพ full URL
    const normalOrdersWithImages = normalOrders.map((order) => ({
  ...order,
  order_items: order.order_items.map((item) => {
    const prod = item.products; // object เดียว
    const productImages = prod.product_images.map((img) => ({
      ...img,
      image_url: getFullUrl(img.image_url),
    }));

    return {
      ...item,
      products: {
        ...prod,
        product_images: productImages,
      },
    };
  }),
}));

   

    res.json({ normalOrders: normalOrdersWithImages });
  } catch (error) {
    console.error("❌ Error loading shop orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /orders/tracking
 */
shoporderRoute.patch("/orders/tracking", authenticateToken, authstore, async (req: Request, res: Response) => {
  const { orderShopId, trackingNumber } = req.body;
  const shopId = req.user?.shop_id;

  if (!orderShopId || !trackingNumber || trackingNumber.trim() === "") {
     res.status(400).json({ error: "orderShopId และ trackingNumber ต้องถูกส่งมา" });
     return;
  }

  try {
    const result = await prisma.order_shops.updateMany({
      where: { order_shop_id: Number(orderShopId), shop_id: shopId },
      data: { tracking_number: trackingNumber.trim() },
    });

    if (result.count === 0) {
       res.status(404).json({ error: "Order not found or unauthorized" });
       return;
    }

    res.json({ message: "อัปเดตเลขพัสดุเรียบร้อย" });
  } catch (err) {
    console.error("❌ อัปเดตเลขพัสดุล้มเหลว:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /orders/status
 */
shoporderRoute.patch("/orders/status", authenticateToken, authstore, async (req: Request, res: Response) => {
  const { orderShopId, status } = req.body;
  const shopId = req.user?.shop_id;

  if (!orderShopId || !status || status.trim() === "") {
     res.status(400).json({ error: "orderShopId และ status ต้องถูกส่งมา" });
     return;
  }

  const orderShopIdNum = Number(orderShopId);
  if (isNaN(orderShopIdNum)) {
     res.status(400).json({ error: "orderShopId ต้องเป็นตัวเลข" });
     return;
  }

  const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
  if (!validStatuses.includes(status.trim())) {
     res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
     return;
  }

  try {
    const result = await prisma.order_shops.updateMany({
      where: { order_shop_id: orderShopIdNum, shop_id: shopId },
      data: { status: status.trim() },
    });

    if (result.count === 0) {
       res.status(404).json({ error: "ไม่พบคำสั่งซื้อหรือคุณไม่มีสิทธิ์" });
       return;
    }

    res.json({ message: "อัปเดตสถานะคำสั่งซื้อเรียบร้อย" });
  } catch (err) {
    console.error("❌ อัปเดตสถานะล้มเหลว:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

export default shoporderRoute;
