import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, authstore } from "../../../middleware/authMiddleware";

const confirmgrouporderRoute = Router();
const prisma = new PrismaClient();

confirmgrouporderRoute.post("/confirm-group-order", authenticateToken, authstore, async (req: Request, res: Response) => {
  const { group_buying_id } = req.body;
  const shop_id = req.user?.shop_id;

  try {
    // หา group_buying พร้อมข้อมูลสมาชิกและที่อยู่
    const group = await prisma.group_buying.findUnique({
      where: { group_buying_id },
      include: {
        product: true,
        members: {
          where: { left_at: null }, // เฉพาะสมาชิกที่ยังอยู่
          include: { 
            user: {
              select: {
                user_id: true,
                username: true,
                email: true
              }
            }
          },
        },
        member_addresses: {
          include: {
            address: true,
            group_member: {
              include: {
                user: {
                  select: {
                    user_id: true,
                    username: true
                  }
                }
              }
            }
          }
        }
      },
    });

    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // เช็ก status: allow "open" หรือ "full" ก่อนสร้างออเดอร์
    if (group.status === "confirmed" || group.status === "cancelled") {
      res.status(400).json({ message: "Group already confirmed or cancelled" });
      return;
    }

    // ตรวจสอบว่าเป็นเจ้าของ shop หรือไม่
    if (group.shop_id !== shop_id) {
      res.status(403).json({ message: "You are not authorized to confirm this group" });
      return;
    }

    // นับจำนวนสมาชิกที่ยังอยู่ในกลุ่ม
    const activeMembers = group.members.filter(m => m.left_at === null);
    const memberCount = activeMembers.length;

    if (memberCount < group.required_members) {
      res.status(400).json({ 
        message: `Not enough members to confirm this group. Required: ${group.required_members}, Current: ${memberCount}` 
      });
      return;
    }

    // ตรวจสอบว่าสมาชิกทุกคนมีที่อยู่หรือไม่
    const memberAddresses = group.member_addresses;
    const membersWithAddresses = memberAddresses.map(ma => ma.group_member.user.user_id);
    const membersWithoutAddresses = activeMembers.filter(
      member => !membersWithAddresses.includes(member.user_id)
    );

    if (membersWithoutAddresses.length > 0) {
      const missingAddressUsers = membersWithoutAddresses.map(m => m.user.username).join(', ');
      res.status(400).json({ 
        message: `Some members haven't provided addresses: ${missingAddressUsers}` 
      });
      return;
    }

    // คำนวณยอดรวม
    const totalAmount = memberCount * (group.points_per_member ?? 0);

    // Transaction เพื่อสร้าง order และอัพเดท status พร้อมกัน
    const result = await prisma.$transaction(async (prisma) => {
      // สร้าง group_order
      const newOrder = await prisma.group_order.create({
        data: {
          group_buying_id: group.group_buying_id,
          total_amount: totalAmount,
          status: "pending",
          items: {
            create: [
              {
                product_id: group.product_id,
                quantity: group.items_per_member * memberCount,
                price_per_unit: group.points_per_member,
              },
            ],
          },
        },
        include: { 
          items: true,
          group: {
            include: {
              product: true,
              shop: true
            }
          }
        },
      });

      // อัพเดทสถานะ group_buying เป็น confirmed
      await prisma.group_buying.update({
        where: { group_buying_id },
        data: { 
          status: "confirmed",
          updated_at: new Date()
        },
      });

      return newOrder;
    });

    // สร้างข้อมูลสรุปสำหรับ response
    const orderSummary = {
      order_id: result.group_order_id,
      group_buying_id: group.group_buying_id,
      group_name: group.group_name,
      product_name: group.product?.product_name,
      total_members: memberCount,
      total_amount: totalAmount,
      items_per_member: group.items_per_member,
      total_items: group.items_per_member * memberCount,
      status: result.status,
      created_at: result.created_at,
      member_details: memberAddresses.map(ma => ({
        user_id: ma.group_member.user.user_id,
        username: ma.group_member.user.username,
        address: {
          name: `${ma.address.firstname} ${ma.address.lastname}`,
          phone: ma.address.phone_number,
          full_address: `${ma.address.house_number} ${ma.address.street} ${ma.address.sub_district} ${ma.address.district} ${ma.address.province} ${ma.address.postal_code}`
        }
      }))
    };

    res.json({
      message: "Group order created successfully",
      order: result,
      summary: orderSummary
    });

  } catch (err) {
    console.error("Error confirming group order:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default confirmgrouporderRoute;
