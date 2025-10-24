import { Router, Request, Response } from "express";
import { authenticateToken,authadmin } from "../../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const allOrderHistoryRoute = Router();
const prisma = new PrismaClient();

allOrderHistoryRoute.get(
  "/all-orders",
  authenticateToken,
  authadmin, // ตรวจสอบว่าเป็น admin
  async (req: Request, res: Response) => {
    try {
      const orders = await prisma.order.findMany({
        select: {
          order_id: true,
          user_id: true,
          order_date: true,
          total_amount: true,
          status: true,
          address_id: true,
          address: {
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
          },
          order_shops: {
            select: {
              order_shop_id: true,
              shop_id: true,
              status: true,
              tracking_number: true,
              subtotal: true,
              shops: {
                select: { shop_name: true },
              },
              order_items: {
                select: {
                  order_item_id: true,
                  product_id: true,
                  quantity: true,
                  price_per_unit: true,
                  total_price: true,
                  products: {
                    select: { product_name: true },
                  },
                  variant_option: {
                    select: {
                      variant_option_id: true,
                      value: true,
                      option: {
                        select: {
                          name: true, // option_name เดิม
                        },
                      },
                      variant: {
                        select: {
                          sku: true, // variant_name เดิม
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

      res.json({ success: true, data: orders });
    } catch (error) {
      console.error("❌ Error loading all orders:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

export default allOrderHistoryRoute;
