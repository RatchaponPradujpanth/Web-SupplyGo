import { Router, Request, Response } from 'express';
import { authenticateToken } from "../middleware/authMiddleware";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const loadaddressRoute = Router();

// GET /api/address  - ดึงที่อยู่ทั้งหมดของ user ที่ login
loadaddressRoute.get('/address', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response) => {
  try {
    const userId = req.user!.user_id;

    const addresses = await prisma.address.findMany({
      where: { user_id: userId }
    });

    res.status(200).json({
      addresses,
    });
  } catch (error) {
    console.error('❌ ดึงที่อยู่ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงที่อยู่ได้' });
  }
});

export default loadaddressRoute;
