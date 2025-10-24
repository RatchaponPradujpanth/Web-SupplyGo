import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const profileRoute = Router();
const prisma = new PrismaClient();

// GET /api/profile - Get user profile
profileRoute.get('/profile', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response): Promise<void> => {
  try {
    const userId = req.user!.user_id;

    // Use raw query to avoid TypeScript issues with new fields
    const user = await prisma.$queryRaw<Array<{
      user_id: number;
      username: string | null;
      email: string | null;
      role: string | null;
    }>>`
      SELECT user_id, username, email, role 
      FROM users 
      WHERE user_id = ${userId}
    `;

    if (!user || user.length === 0) {
      res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
      return;
    }

    res.status(200).json(user[0]);
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

    // Check if username or email already exists (excluding current user)
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

    // Update user profile using raw SQL
    await prisma.$executeRaw`
      UPDATE users 
      SET username = ${username}, email = ${email}
      WHERE user_id = ${userId}
    `;

    // Get updated user data
    const updatedUser = await prisma.$queryRaw<Array<{
      user_id: number;
      username: string | null;
      email: string | null;
      role: string | null;
    }>>`
      SELECT user_id, username, email, role 
      FROM users 
      WHERE user_id = ${userId}
    `;

    res.status(200).json({
      message: 'อัปเดตโปรไฟล์สำเร็จ',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('❌ อัปเดตโปรไฟล์ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถอัปเดตโปรไฟล์ได้' });
  }
});

export default profileRoute;