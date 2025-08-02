import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from "../middleware/authMiddleware";

const addressRoute = Router();
const prisma = new PrismaClient();

// POST /api/address
addressRoute.post('/add-address', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response) => {
  const { address } = req.body;

  try {
    const newAddress = await prisma.address.create({
      data: {
        user_id: req.user!.user_id,
        firstname: address.firstname,
        lastname: address.lastname,
        phone_number: address.phone_number,
        house_number: address.house_number,
        street: address.street,
        sub_district: address.sub_district,
        district: address.district,
        province: address.province,
        postal_code: address.postal_code,
        address_type: address.address_type,
      },
      select: {
        address_id: true,
      }
    });

    res.status(200).json({
      message: 'เพิ่มที่อยู่สำเร็จ',
      address_id: newAddress.address_id,
    });
  } catch (error) {
    console.error('❌ เพิ่มที่อยู่ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถเพิ่มที่อยู่ได้' });
  }
});

export default addressRoute;
