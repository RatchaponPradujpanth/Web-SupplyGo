import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const profileRoute = Router();
const prisma = new PrismaClient();

// GET /api/profile - Get user profile
profileRoute.get('/profile', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response): Promise<void> => {
  try {
    const userId = req.user!.user_id;

    // ใช้ Prisma ในการดึงข้อมูลจากฐานข้อมูล
    const user = await prisma.users.findUnique({
      where: {
        user_id: userId,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('❌ ดึงข้อมูลโปรไฟล์ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้' });
  }
});

// PUT /api/profile - Update user profile
profileRoute.put('/profile', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { username, email } = req.body;

    // Validate input
    if (!username || !email) {
      res.status(400).json({ message: 'ชื่อผู้ใช้และอีเมลจำเป็นต้องกรอก' });
      return;
    }

    // ตรวจสอบว่า username หรือ email ซ้ำกับผู้ใช้อื่น
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username: username, user_id: { not: userId } },
          { email: email, user_id: { not: userId } }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
        return;
      }
      if (existingUser.email === email) {
        res.status(400).json({ message: 'อีเมลนี้ถูกใช้แล้ว' });
        return;
      }
    }

    // อัปเดตข้อมูลโปรไฟล์
    const updatedUser = await prisma.users.update({
      where: {
        user_id: userId,
      },
      data: {
        username,
        email,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    res.status(200).json({
      message: 'อัปเดตโปรไฟล์สำเร็จ',
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ อัปเดตโปรไฟล์ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถอัปเดตโปรไฟล์ได้' });
  }
});

export default profileRoute;
