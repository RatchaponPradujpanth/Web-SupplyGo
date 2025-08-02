import { Router, Request, Response } from "express";
import { authenticateToken,authstore } from "../middleware/authMiddleware";
import { PrismaClient} from "@prisma/client";

const orderhistoryRoute = Router();
const prisma = new PrismaClient();
orderhistoryRoute.get("/orderhistory", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.user_id;
  console.log("🔍 userId from token:", userId);

  try {
    // ดึง order ของ user พร้อม address_id
    const findorderaddress = await prisma.order.findMany({
      where: { user_id: userId },
      select: { order_id: true, address_id: true },
    });
    console.log("📦 findorderaddress:", findorderaddress);

    if (findorderaddress.length === 0) {
      console.log("⚠️ ไม่มี order ของ user นี้");
      res.json({ orders: [], order_shops: [], order_items: [], addresses: [] });
      return;
    }

    // ดึง order_id และ address_id (ไม่ซ้ำ)
    const maporderid = findorderaddress.map(order => order.order_id);
    const mapaddressid = [...new Set(findorderaddress.map(order => order.address_id))];
    console.log("🆔 maporderid:", maporderid);
    console.log("🏠 mapaddressid:", mapaddressid);

    // ดึง order_shops ตาม order_id
    const findordershop = await prisma.order_shops.findMany({
      where: { order_id: { in: maporderid } },
      select: {
        order_shop_id: true,
        shop_id: true,
        subtotal: true,
        status: true,
        tracking_number: true,
        order_id: true,   // เพิ่ม order_id ไว้สำหรับการกรองใน frontend
      },
    });
    console.log("🏪 findordershop:", findordershop);

    if (findordershop.length === 0) {
      console.log("⚠️ ไม่มี order_shops สำหรับ orders นี้");
      res.json({ orders: findorderaddress, order_shops: [], order_items: [], addresses: [] });
      return;
    }

    // ดึง order_shop_id
    const mapordershopid = findordershop.map(order_shop => order_shop.order_shop_id);
    console.log("🆔 mapordershopid:", mapordershopid);

    // หารายการสินค้าที่สั่งไป
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
    console.log("📋 findorderitem:", findorderitem);

    // หาที่อยู่
    const findaddressdetail = await prisma.address.findMany({
      where: {
        user_id: userId,
        address_id: { in: mapaddressid },
      },
      select: {
        address_id: true,  // เพิ่ม address_id เพื่อใช้กรองใน frontend
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
    console.log("🏠 findaddressdetail:", findaddressdetail);

    res.json({
      orders: findorderaddress,
      order_shops: findordershop,
      order_items: findorderitem,
      addresses: findaddressdetail,
    });
  } catch (error) {
    console.error("❌ Error loading history order :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
export default orderhistoryRoute;