// routes/withdraw.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import { authenticateToken, authstore } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const withdrawRoute = Router();

// ร้านค้าสร้างคำขอถอนเงิน
withdrawRoute.post('/request-withdraw', authenticateToken, authstore, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const shopId = req.user?.shop_id;
    const { points } = req.body;

    if (!userId || !shopId){ 
      res.status(401).json({ message: 'Unauthorized' });
      return 
    }
    if (!points || points <= 0) {
      res.status(400).json({ message: 'จำนวนเงินไม่ถูกต้อง' });
      return 
    }
    const wallet = await prisma.store_wallets.findUnique({ where: { shop_id: shopId } });
    if (!wallet || wallet.points < points)  {
      res.status(400).json({ message: 'ยอดเงินไม่เพียงพอ' });
      return 
    }
    // สร้าง withdraw request แบบ pending
    const withdrawal = await prisma.store_withdrawals.create({
      data: {
        shop_id: shopId,
        points,
        status: 'pending', // รอ admin อนุมัติ
      }
    });

    // ลด point ทิ้งไว้เลย (หรือจะรอ approve ก็ได้)
    await prisma.store_wallets.update({
      where: { shop_id: shopId },
      data: { points: { decrement: points } }
    });

    console.log('💰 Withdraw request created:', withdrawal);

    res.status(200).json({
      message: 'สร้างคำขอถอนเงินเรียบร้อย รอการอนุมัติจากแอดมิน',
      withdrawal
    });

  } catch (error) {
    console.error('❌ สร้างคำขอถอนเงินล้มเหลว:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: String(error) });
    return 
  }
});

export default withdrawRoute;
