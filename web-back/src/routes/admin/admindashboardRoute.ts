import { Router, Request, Response } from "express";
import { authenticateToken } from "../../middleware/authMiddleware"; 
import { PrismaClient } from "@prisma/client";

const admindashboardRoute = Router();
const prisma = new PrismaClient();

admindashboardRoute.get(
  "/admindashboard",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.user_id;
    const role = req.user?.role;

    console.log("🔹 Incoming request from user:", userId, "role:", role);

    try {
      if (!userId) {
        console.log("❌ userId not found");
        res.status(404).json({ message: "userId not found" });
        return;
      }

      if (role !== "admin") {
        console.log("❌ Access denied: not admin");
        res.status(403).json({ message: "Access denied: only admin" });
        return;
      }

      // ✅ ดึง username ผู้ที่ล็อกอิน
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { username: true },
      });
      console.log("🔹 Logged in admin username:", user?.username);

      // ✅ Dashboard statsproduct_id: "desc" 
      const totalUsers = await prisma.users.count();
      const totalStores = await prisma.shops.count();
      const totalProducts = await prisma.products.count();
      const totalOrders = await prisma.order.count();
      
      const recentProducts = await prisma.products.findMany({
  take: 10,
  orderBy: { created_date: "desc" },
  select: {
    product_id: true,
    product_name: true,
    price: true,
    status: true,
    created_date: true,
    product_owners: {
      select: {
        shops: {
          select: {
            shop_name: true
          }
        }
      }
    }
  },
});
      console.log("🔹 Dashboard counts:", {
        totalUsers,
        totalStores,
        totalProducts,
        totalOrders,
      });

      // ✅ Recent Orders (ล่าสุด 5 รายการ)
      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { order_date: "desc" },
        select: {
          order_id: true,
          status: true,
          total_amount: true,
          order_date: true,
          users: { select: { username: true } },
        },
      });

      console.log("🔹 Recent orders:", recentOrders);

      // ✅ response กลับไปให้ frontend
      const responseData = {
        message: `ยินดีต้อนรับ ${role} คุณ ${user?.username}`,
        dashboard: {
          totalUsers,
          totalStores,
          totalProducts,
          totalOrders,
          recentOrders,
           recentProducts,
        },
      };
      console.log("🔹 Sending response:", responseData);

      res.json(responseData);

    } catch (error) {
      console.error("❌ Error loading dashboard admin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);


export default admindashboardRoute;
