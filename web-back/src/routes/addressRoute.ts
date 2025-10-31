import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from "../middleware/authMiddleware";

const addressRoute = Router();
const prisma = new PrismaClient();

// ----------------------
// POST /api/address/add-address
// ----------------------
addressRoute.post('/add-address', authenticateToken, async (req: Request & { user?: { user_id: number; shop_id?: number } }, res: Response) => {
  const { address } = req.body;
  const shop_id = req.user?.shop_id; // ใช้ shop_id จาก token

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. สร้าง address ใหม่
      const newAddress = await tx.address.create({
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
        select: { address_id: true }
      });

      // 2. อัพเดท shop ถ้ามี shop_id ใน token
      if (shop_id) {
        await tx.shops.update({
          where: { shop_id },
          data: {
            address: { connect: { address_id: newAddress.address_id } }
          }
        });
      }

      return newAddress;
    });

     res.status(200).json({
      message: 'เพิ่มที่อยู่สำเร็จ',
      address_id: result.address_id,
    });

  } catch (error: any) {
    console.error('❌ เพิ่มที่อยู่ล้มเหลว:', error);
     res.status(500).json({ message: error.message || 'ไม่สามารถเพิ่มที่อยู่ได้' });
     return
  }
});

// ----------------------
// PUT /api/address/:addressId
// ----------------------
addressRoute.put('/address/:addressId', authenticateToken, async (req: Request & { user?: { user_id: number; shop_id?: number } }, res: Response) => {
  const { addressId } = req.params;
  const { address } = req.body;
  const userId = req.user!.user_id;
  const shop_id = req.user?.shop_id; // ใช้ shop_id จาก token

  console.log('userid',userId,'shop id',shop_id);
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingAddress = await tx.address.findFirst({
        where: { address_id: parseInt(addressId), user_id: userId }
      });
      if (!existingAddress) throw new Error('NOT_FOUND');

      const updatedAddress = await tx.address.update({
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

      if (shop_id) {
        await tx.shops.update({
          where: { shop_id },
          data: {
            address: { connect: { address_id: updatedAddress.address_id } }
          }
        });
      }

      return updatedAddress;
    });

     res.status(200).json({ message: 'อัปเดตที่อยู่สำเร็จ' });

  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
       res.status(404).json({ message: 'ไม่พบที่อยู่หรือคุณไม่มีสิทธิ์แก้ไข' });
       return
    }
    console.error('❌ อัปเดตที่อยู่ล้มเหลว:', error);
     res.status(500).json({ message: error.message || 'ไม่สามารถอัปเดตที่อยู่ได้' });
    return
  }
});

// ----------------------
// DELETE /api/address/:addressId
// ----------------------
addressRoute.delete('/address/:addressId', authenticateToken, async (req: Request & { user?: { user_id: number; shop_id?: number } }, res: Response) => {
  const { addressId } = req.params;
  const userId = req.user!.user_id;
  const shop_id = req.user?.shop_id; // ใช้ shop_id จาก token

  try {
    await prisma.$transaction(async (tx) => {
      const existingAddress = await tx.address.findFirst({
        where: { address_id: parseInt(addressId), user_id: userId }
      });
      if (!existingAddress) throw new Error('NOT_FOUND');

      await tx.address.delete({ where: { address_id: parseInt(addressId) } });

      if (shop_id) {
        await tx.shops.update({
          where: { shop_id },
          data: { address: { disconnect: true } }
        });
      }
    });

     res.status(200).json({ message: 'ลบที่อยู่สำเร็จ' });

  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
       res.status(404).json({ message: 'ไม่พบที่อยู่หรือคุณไม่มีสิทธิ์ลบ' });
       return
    }
    console.error('❌ ลบที่อยู่ล้มเหลว:', error);
     res.status(500).json({ message: error.message || 'ไม่สามารถลบที่อยู่ได้' });
     return
  }
});

export default addressRoute;
