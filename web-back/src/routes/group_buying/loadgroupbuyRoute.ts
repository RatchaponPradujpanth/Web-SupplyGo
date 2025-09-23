import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../../middleware/authMiddleware";
const loadgroupbuyRoute = Router();
const prisma = new PrismaClient();

loadgroupbuyRoute.get("/loadgroup",authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // รับ user_id จาก query
    const userId = req.user?.user_id

    const groups = await prisma.group_buying.findMany({
      include: {
        product: {
          include: {
            product_images: true
          }
        },
        members: {
          where: {
            left_at: null  // เฉพาะสมาชิกที่ยังอยู่ในกลุ่ม
          },
          include: {
            user: {
              select: {
                user_id: true,
                username: true
              }
            }
          }
        },
        shop: {
          select: {
            shop_id: true,
            shop_name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'  // เรียงลำดับจากใหม่ไปเก่า
      }
    });

    if (groups.length === 0) {
      res.status(200).json({ groups: [] });
      return;
    }

    // ประกอบ URL ของรูปให้สมบูรณ์
    const protocol = req.protocol;
    const host = req.headers.host;

    const groupsWithFullData = groups.map(group => {
      const product = group.product;
      if (product && product.product_images) {
        product.product_images = product.product_images.map(img => ({
          ...img,
          image_url: img.image_url.startsWith("http")
            ? img.image_url
            : `${protocol}://${host}${img.image_url}`
        }));
      }

      // ตรวจสอบและอัพเดท status ของกลุ่มอัตโนมัติ
      const currentMembers = group.members?.length || 0;
      let updatedStatus = group.status;

      if (currentMembers >= group.required_members && group.status === 'open') {
        updatedStatus = 'closed';
        prisma.group_buying.update({
          where: { group_buying_id: group.group_buying_id },
          data: { status: 'closed' }
        }).catch(err => console.error('Error updating group status:', err));
      }

      // ✅ ตรวจสอบว่า user อยู่ใน group หรือยัง
      const user_in_group = userId
        ? group.members?.some(m => m.user.user_id === userId) || false
        : false;

      return { 
        ...group, 
        product,
        status: updatedStatus,
        current_members: currentMembers,
        is_full: currentMembers >= group.required_members,
        user_in_group
      };
    });

    console.log(`Loaded ${groupsWithFullData.length} groups with members data`);
    res.json({ groups: groupsWithFullData });
  } catch (error) {
    console.error('Error loading groups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default loadgroupbuyRoute;
