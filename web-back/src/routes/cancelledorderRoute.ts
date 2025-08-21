import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient } from "@prisma/client";

const cancelledorderRoute = Router();
const prisma = new PrismaClient();

cancelledorderRoute.patch("/status-cancelled",authenticateToken,async(req : Request , res : Response):Promise<void> =>{
    const { id } = req.params;
    const userId = req.user?.user_id;

    try {
    const order = await prisma.order.updateMany({
      where: {
        order_id: Number(id),
        user_id: userId,
        status: { in: ["pending", "not_paid"] }, // ยกเลิกได้แค่ยังไม่จ่าย
      },
      data: { status: "cancelled" },
    });

    if (order.count === 0) {
       res.status(404).json({ error: "Order not found or already processed" });
    return
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});





export default cancelledorderRoute