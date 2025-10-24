// backend/routes/admin/withdraw.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authadmin } from '../../../middleware/authMiddleware';

const prisma = new PrismaClient();
const loadwithdrawRoute = Router();

loadwithdrawRoute.get('/pending-withdrawals', authenticateToken, authadmin, async (req: Request, res: Response) => {
  try {
    const withdrawals = await prisma.store_withdrawals.findMany({
      where: { status: 'pending' },
      include: {
        store: {
          select: {
            shop_id: true,
            shop_name: true,
            stripe_account_id: true,
          },
        },
      },
      orderBy: { requested_at: 'desc' },
    });

    res.status(200).json({ withdrawals });
  } catch (error) {
    console.error('❌ Fetch pending withdrawals failed:', error);
    res.status(500).json({ message: 'Failed to fetch pending withdrawals', error: String(error) });
  }
});

export default loadwithdrawRoute;

