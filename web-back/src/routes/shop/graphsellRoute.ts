import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const graphsellRoute = Router();
const prisma = new PrismaClient();

graphsellRoute.post("/graph-sell", authenticateToken, authstore, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate are required" });
      return;
    }

    // แก้ไข: ขยาย end date ไปอีก 1 วัน เพื่อรองรับ timezone
    const start = new Date(startDate + "T00:00:00+07:00");
    const end = new Date(endDate + "T23:59:59.999+07:00");
    
    // เพิ่ม 7 ชั่วโมงเพื่อรองรับข้อมูลที่บันทึกเป็น local time แต่แปลงเป็น UTC
    const endExtended = new Date(end);
    endExtended.setHours(end.getHours() + 7);

    console.log("📅 Query Range:", { start, end: endExtended });
    console.log("📅 Local Time:", { 
      start: start.toLocaleString('th-TH'), 
      end: endExtended.toLocaleString('th-TH') 
    });

    // ----------------------------
    // 1️⃣ ดึง order_shops ที่จ่ายแล้ว และ order_date ในช่วงที่เลือก
    // ----------------------------
    const paidShops = await prisma.order_shops.findMany({
      where: {
        status: "paid",
        order: {
          order_date: {
            gte: start,
            lte: endExtended, // ใช้ endExtended แทน end
          },
        },
      },
      select: {
        order_shop_id: true,
        subtotal: true,
        order: { select: { order_date: true } },
      },
    });

    console.log("🛍️ Found paid shops:", paidShops.length); // เพิ่ม log
    console.log("📦 Paid shops data:", paidShops); // ดูข้อมูลทั้งหมด

    // รวมยอดขายรายวัน
    const dailySales: Record<string, number> = {};
    paidShops.forEach((shop) => {
      const orderDate = shop.order.order_date;
      if (!orderDate) {
        console.log("⚠️ Shop without order_date:", shop.order_shop_id);
        return;
      }
      
      // แปลงเป็น local date (ไม่ใช้ UTC)
      const date = orderDate.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
      const amount = Number(shop.subtotal || 0);
      
      console.log(`📊 Adding: ${date} -> ${amount} (current: ${dailySales[date] || 0})`);
      
      dailySales[date] = (dailySales[date] || 0) + amount;
    });

    // ----------------------------
    // 2️⃣ ดึง order_items ของ order_shops เหล่านี้
    // ----------------------------
    const shopIds = paidShops.map((s) => s.order_shop_id);
    
    const orderItems = await prisma.order_items.findMany({
      where: { order_shop_id: { in: shopIds } },
      select: { product_id: true, quantity: true },
    });

    // รวมยอดขายต่อสินค้า
    const productMap: Record<number, number> = {};
    orderItems.forEach((item) => {
      productMap[item.product_id] = (productMap[item.product_id] || 0) + (item.quantity || 0);
    });

    // ดึงชื่อสินค้าจาก product_id
    const products = await prisma.products.findMany({
      where: { product_id: { in: Object.keys(productMap).map(Number) } },
      select: { product_id: true, product_name: true },
    });

    const productSales = products.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      quantity_sold: productMap[p.product_id] || 0,
    }));

    console.log("รายวัน", dailySales);
    console.log("สินค้า", productSales);

    res.json({ dailySales, productSales });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default graphsellRoute;