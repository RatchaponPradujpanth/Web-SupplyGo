import { Router, Request, Response } from "express";
import { authenticateToken } from "../../middleware/authMiddleware"; 
import { PrismaClient } from "@prisma/client";

const loadbalanceRoute = Router();
const prisma = new PrismaClient();

loadbalanceRoute.get("/loadbalance", authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.user_id;

    try {
        // หา balance ของ user
        let userPoint = await prisma.user_points.findUnique({
            where: { user_id: userId },
            select: { balance: true },
        });

        // ถ้าไม่มี row สำหรับ user นี้ ให้สร้างใหม่ balance = 0
        if (!userPoint) {
            userPoint = await prisma.user_points.create({
                data: { user_id: userId!, balance: 0 },
                select: { balance: true },
            });
        }

        console.log(`balance for user ${userId}:`, userPoint.balance);
        res.json({ balance: userPoint.balance });
    } catch (error) {
        console.error('Error loading balance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default loadbalanceRoute;
