import { Router, Request, Response } from "express";
import { authadmin, authenticateToken } from "../../middleware/authMiddleware"; 
import { PrismaClient } from "@prisma/client";

const admindashboardRoute = Router();
const prisma = new PrismaClient();

admindashboardRoute.get(
  "/admindashboard",
  authenticateToken,authadmin,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.user_id;
    const role = req.user?.role;

    console.log("🔹 Incoming request from user:", userId, "role:", role);

    try {
      if (!userId) {
        res.status(404).json({ message: "userId not found" });
        return;
      }

      if (role !== "admin") {
        res.status(403).json({ message: "Access denied: only admin" });
        return;
      }

      // ✅ ดึง username admin ที่ล็อกอินอยู่
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { username: true },
      });

      // ✅ ทำ Promise.all ให้ query ขนานกัน
      const [totalUsers, totalStores, totalProducts, totalOrders, recentProducts, recentOrders, allUsers] =
  await Promise.all([
    prisma.users.count(),
    prisma.shops.count(),
    prisma.products.count(),
    prisma.order.count(),
    prisma.products.findMany({
      take: 10,
      orderBy: { created_date: "desc" },
      select: {
        product_id: true,
        product_name: true,
        price: true,
        status: true,
        created_date: true,
        product_owners: {
          select: { shops: { select: { shop_name: true } } }
        }
      }
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { order_date: "desc" },
      select: {
        order_id: true,
        status: true,
        total_amount: true,
        order_date: true,
        users: { select: { username: true } },
      }
    }),
    prisma.users.findMany({
      select: {
        user_id: true,
        username: true,
        email: true,
        registration_date: true,
        role: true,
      },
      orderBy: { registration_date: "desc" },
    })
  ]);


      // ✅ รวม response
      const responseData = {
  message: `ยินดีต้อนรับ ${role} คุณ ${user?.username}`,
  dashboard: {
    totalUsers,
    totalStores,
    totalProducts,
    totalOrders,
    recentProducts,
    recentOrders,
    allUsers, // ✅ เพิ่มตรงนี้
  },
};

res.json(responseData);

    } catch (error) {
      console.error("❌ Error loading dashboard admin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default admindashboardRoute;
