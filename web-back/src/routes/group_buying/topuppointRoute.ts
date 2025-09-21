import { Router, Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../../middleware/authMiddleware';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();

const topuppointRoute = Router();

topuppointRoute.post("/topup-point", authenticateToken, async (req: Request, res: Response) => {
    const userId = req.user?.user_id;
    const { points } = req.body; // 🔧 แก้ไขตรงนี้ - destructure points จาก req.body

    if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    // 🔧 เพิ่ม validation ที่ครอบคลุมมากขึ้น
    const pointsNumber = Number(points);
    if (!points || isNaN(pointsNumber) || pointsNumber <= 0 || !Number.isInteger(pointsNumber)) {
        res.status(400).json({ message: 'Points must be a valid positive integer' });
        return;
    }

    // 🔧 ใช้ pointsNumber แทน points
    const amount = pointsNumber * 100; // แปลงเป็น satang

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'thb',
            automatic_payment_methods: { enabled: true },
            metadata: { 
                userId: userId.toString(), 
                points: pointsNumber.toString() 
            },
        });

        await prisma.point_transactions.create({
            data: {
                user_id: userId,
                points: pointsNumber, // 🔧 ใช้ pointsNumber
                amount: pointsNumber, // 🔧 เก็บจำนวน points แทนการหาร 100
                transaction_id: paymentIntent.id,
                status: "pending" // 🔧 แก้ typo จาก "pedding"
            }
        });

        res.json({ client_secret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ 
            message: "Failed to create payment", 
            error: error instanceof Error ? error.message : String(error) 
        });
    }
});

export default topuppointRoute;