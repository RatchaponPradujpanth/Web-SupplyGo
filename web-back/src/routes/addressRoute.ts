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
        phone_number: address.phone_number ? parseInt(address.phone_number) : null,
        house_number: address.house_number,
        street: address.street,
        sub_district: address.sub_district,
        district: address.district,
        province: address.province,
        postal_code: address.postal_code ? parseInt(address.postal_code) : null,
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

// PUT /api/address/:addressId - Update address
addressRoute.put('/address/:addressId', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response) => {
  const { addressId } = req.params;
  const { address } = req.body;
  const userId = req.user!.user_id;

  try {
    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        address_id: parseInt(addressId),
        user_id: userId
      }
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'ไม่พบที่อยู่หรือคุณไม่มีสิทธิ์แก้ไข' });
    }

    await prisma.address.update({
      where: { address_id: parseInt(addressId) },
      data: {
        firstname: address.firstname,
        lastname: address.lastname,
        phone_number: address.phone_number ? parseInt(address.phone_number) : null,
        house_number: address.house_number,
        street: address.street,
        sub_district: address.sub_district,
        district: address.district,
        province: address.province,
        postal_code: address.postal_code ? parseInt(address.postal_code) : null,
        address_type: address.address_type,
      }
    });

    res.status(200).json({
      message: 'อัปเดตที่อยู่สำเร็จ'
    });
  } catch (error) {
    console.error('❌ อัปเดตที่อยู่ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถอัปเดตที่อยู่ได้' });
  }
});

// DELETE /api/address/:addressId - Delete address
addressRoute.delete('/address/:addressId', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response) => {
  const { addressId } = req.params;
  const userId = req.user!.user_id;

  try {
    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        address_id: parseInt(addressId),
        user_id: userId
      }
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'ไม่พบที่อยู่หรือคุณไม่มีสิทธิ์ลบ' });
    }

    await prisma.address.delete({
      where: { address_id: parseInt(addressId) }
    });

    res.status(200).json({
      message: 'ลบที่อยู่สำเร็จ'
    });
  } catch (error) {
    console.error('❌ ลบที่อยู่ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถลบที่อยู่ได้' });
  }
});

export default addressRoute;
