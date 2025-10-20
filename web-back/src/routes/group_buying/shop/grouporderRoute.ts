import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../../../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const grouporderRoute = Router();
const prisma = new PrismaClient();
grouporderRoute.get("/group-order", authenticateToken, authstore, async (req: Request, res: Response) => {
  const shop_id = req.user?.shop_id;

  if (!shop_id) {
    res.status(400).json({ message: "Shop ID not found." });
    return;
  }

  try {
    const finalData = await prisma.group_order.findMany({
      where: {
        group: { shop_id },
      },
      include: {
        group: {
          include: {
            product: true,
            variant: true,
            members: {
              include: {
                user: {
                  select: {
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        member_orders: {
          include: {
            group_member: {
              include: {
                user: {
                  select: {
                    username: true,
                    email: true,
                  },
                },
                member_addresses: {
                  include: { address: true },
                },
              },
            },
          },
        },
      },
    });

    if (!finalData.length) {
      res.status(404).json({ message: "No group orders found for this shop." });
      return;
    }

    res.status(200).json({
      message: "Fetched group orders successfully.",
      data: finalData,
    });
  } catch (error) {
    console.error("Error fetching group orders:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

export default grouporderRoute;
