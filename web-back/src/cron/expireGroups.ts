import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function expireGroupBuyings() {
  console.log("🕐 Running expireGroupBuyings cron job...");

  try {
    const now = new Date();

    // หากลุ่มที่หมดอายุและยังไม่เต็ม
    const expiredGroups = await prisma.group_buying.findMany({
      where: {
        expire_at: { lte: now },
        status: "open", // เฉพาะกลุ่มที่ยังเปิดอยู่
      },
      include: {
        members: { where: { left_at: null } },
      },
    });

    console.log(`📋 Found ${expiredGroups.length} expired groups`);

    for (const group of expiredGroups) {
      await prisma.$transaction(async (tx) => {
        // คืน point ให้สมาชิกทุกคน
        for (const member of group.members) {
          await tx.user_points.update({
            where: { user_id: member.user_id },
            data: { points: { increment: group.points_per_member } },
          });

          await tx.user_point_transactions.create({
            data: {
              user_id: member.user_id,
              shop_id: group.shop_id,
              points: group.points_per_member,
              type: "refund",
            },
          });

          // ทำเครื่องหมายว่า member ออกจาก group (กลุ่มหมดอายุ)
          await tx.group_members.update({
            where: { group_members_id: member.group_members_id },
            data: {
              left_at: new Date()
            },
          });
        }

        // หัก point ของร้าน
        if (group.members.length > 0) {
          await tx.store_wallets.update({
            where: { shop_id: group.shop_id },
            data: {
              points: { decrement: group.points_per_member * group.members.length },
            },
          });
        }

        // อัปเดตสถานะกลุ่ม
        await tx.group_buying.update({
          where: { group_buying_id: group.group_buying_id },
          data: { status: "expired", updated_at: new Date() },
        });

        console.log(`✅ Group ${group.group_buying_id} expired and refunded`);
      });
    }

    console.log("✅ expireGroupBuyings completed");
  } catch (error) {
    console.error("❌ Error in expireGroupBuyings:", error);
  }
}

// ถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
  expireGroupBuyings()
    .then(() => {
      console.log("Done");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
}
