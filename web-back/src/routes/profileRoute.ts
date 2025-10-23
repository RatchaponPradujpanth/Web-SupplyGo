import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const profileRoute = Router();
const prisma = new PrismaClient();

// Configure multer for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.user_id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `profile-${userId}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('ไฟล์ที่อัปโหลดต้องเป็นรูปภาพเท่านั้น (JPEG, PNG, WebP)'));
    }
  }
});

// GET /api/profile - Get user profile
profileRoute.get('/profile', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response): Promise<void> => {
  try {
    const userId = req.user!.user_id;

    // Use raw query to avoid TypeScript issues with new fields
    const user = await prisma.$queryRaw<Array<{
      user_id: number;
      username: string | null;
      email: string | null;
      phone_number: string | null;
      profile_picture: string | null;
      role: string | null;
    }>>`
      SELECT user_id, username, email, phone_number, profile_picture, role 
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
    const { username, email, phone_number } = req.body;

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
      SET username = ${username}, email = ${email}, phone_number = ${phone_number}
      WHERE user_id = ${userId}
    `;

    // Get updated user data
    const updatedUser = await prisma.$queryRaw<Array<{
      user_id: number;
      username: string | null;
      email: string | null;
      phone_number: string | null;
      profile_picture: string | null;
      role: string | null;
    }>>`
      SELECT user_id, username, email, phone_number, profile_picture, role 
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

// POST /api/profile/upload-picture - Upload profile picture
profileRoute.post('/profile/upload-picture', authenticateToken, upload.single('profile_picture'), async (req: Request & { user?: { user_id: number } }, res: Response): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
      return;
    }

    // Get current user to delete old profile picture using raw SQL
    const currentUser = await prisma.$queryRaw<Array<{
      profile_picture: string | null;
    }>>`
      SELECT profile_picture FROM users WHERE user_id = ${userId}
    `;

    // Delete old profile picture if exists
    if (currentUser.length > 0 && currentUser[0].profile_picture) {
      const oldImagePath = path.join(__dirname, '../../uploads', currentUser[0].profile_picture);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update user with new profile picture path using raw SQL
    const profilePicturePath = `/uploads/profiles/${file.filename}`;
    
    await prisma.$executeRaw`
      UPDATE users 
      SET profile_picture = ${profilePicturePath}
      WHERE user_id = ${userId}
    `;

    res.status(200).json({
      message: 'อัปโหลดรูปโปรไฟล์สำเร็จ',
      profile_picture: profilePicturePath
    });
  } catch (error) {
    console.error('❌ อัปโหลดรูปโปรไฟล์ล้มเหลว:', error);
    
    // Delete uploaded file if error occurs
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/profiles', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ message: 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้' });
  }
});

export default profileRoute;