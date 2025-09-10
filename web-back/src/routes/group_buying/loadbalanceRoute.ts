import { Router, Request, Response, response } from "express";
import { authenticateToken } from "../../middleware/authMiddleware"; 
import { PrismaClient, users } from "@prisma/client";

const loadbalanceRoute = Router()
const prisma = new PrismaClient();

loadbalanceRoute.get("/loadbalance",authenticateToken,async (req : Request , res : Response): Promise<void> => {
    const userId = req.user?.user_id;

    try {
        const foundbalance = await prisma.user_points.findFirst({
            where : {
                user_id:userId
            },
            select : {
                balance : true,
            },
        })
        
        if (!foundbalance) {
            res.status(404).json({message : " balance not found"})
            return;
        }

         console.log(`balance:`, foundbalance.balance); // ✅ เพิ่ม console log
        res.json({ balance: foundbalance.balance }); // ส่ง balance จริง ๆ กลับ client
    } catch (error) {
        console.error('Error loading balance:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
})

export default loadbalanceRoute;