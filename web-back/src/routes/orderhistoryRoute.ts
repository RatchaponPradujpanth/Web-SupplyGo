import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const orderhistoryRoute = Router();
const prisma = new PrismaClient();

orderhistoryRoute.get("/orderhistory", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.user_id;
  console.log("🔍 userId from token:", userId);

  try {
    const orders = await prisma.order.findMany({
  where: { user_id: userId },
  select: {
    order_id: true,
    order_date: true,
    total_amount: true,
    status: true,
    address_id:true,
    address : {
      select : {
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
    },
    order_shops: {
      select: {
        order_shop_id: true,
        shop_id: true,
        status: true,
        tracking_number: true,
        subtotal: true,
        shops : {
          select : {shop_name : true},
        },
        order_items: {
          select: {
            product_id:true,
            order_item_id: true,
            quantity: true,
            price_per_unit: true,
            total_price: true,
            products:{
              select : {
                product_name : true
              }
            },
            variant_option: {
              select: {
                variant_option_id: true,
                value: true,
                option: {
                  select: {
                    name: true, // ✅ เปลี่ยนจาก option_name
                  },
                },
                variant: {
                  select: {
                    sku: true, // ✅ เปลี่ยนจาก variant_name
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

res.json({ orders });


  } catch (error) {
    console.error("❌ Error loading history order :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default orderhistoryRoute;