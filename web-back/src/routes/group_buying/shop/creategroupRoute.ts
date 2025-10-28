import { Router, Request, Response } from 'express';
import { authenticateToken, authstore } from '../../../middleware/authMiddleware';
import { PrismaClient } from "@prisma/client";

const creategroupRoute = Router();
const prisma = new PrismaClient();

creategroupRoute.post("/create-group", authenticateToken, authstore, async (req: Request, res: Response) => {
  const userId = req.user?.user_id;
  const shop_id = req.user?.shop_id;
  const { group_name,description,expire_at,product_id,variant_id,required_members,total_items,items_per_member,status,points_per_group,points_per_member} = req.body;

  if (!shop_id || !userId || !product_id || !required_members || !total_items || !items_per_member) {
    console.log("❌ ข้อมูลไม่ครบ");
    res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      console.log(`🔍 Checking product ID: ${product_id}`);
      const productExists = await tx.products.findFirst({
        where: { product_id },
        select: { product_id: true, product_name: true }
      });
      console.log("🏷️ Product check:", productExists);
      if (!productExists) throw new Error(`Product ID ${product_id} does not exist`);

      console.log(`📦 Checking batches for ${variant_id ? 'variant' : 'product'} ID: ${variant_id || product_id}`);
      const allBatches = await tx.product_batches.findMany({
        where: variant_id ? { variant_id } : { product_id },
        orderBy: { expiry_date: "asc" }
      });
      const availableBatches = allBatches.filter(b => b.quantity > 0);
      console.log("📦 Available batches:", availableBatches);

      const batch = availableBatches[0];
      if (!batch) {
        console.log("❌ ไม่มี batch ที่มี stock เหลือ");
        throw new Error("ไม่มี batch ที่มี stock เหลือ");
      }

      if (batch.quantity < total_items) {
        console.log(`❌ Stock ไม่เพียงพอ! Required: ${total_items}, Available: ${batch.quantity}`);
        throw new Error(`Stock ไม่เพียงพอ! Required: ${total_items}, Available: ${batch.quantity}`);
      }

      console.log(`📊 Creating group buying...`);
      const newGroup = await tx.group_buying.create({
        data: {
          shop_id,
          product_id,
          variant_id: variant_id || null,
          required_members,
          total_items,
          items_per_member,
          status: status || "open",
          points_per_group: points_per_group ?? 0,
          points_per_member: points_per_member ?? 0,
          group_name: group_name ?? null,
          description: description ?? null,
          expire_at: expire_at ? new Date(expire_at) : null,
        }
      });

      await tx.product_batches.update({
        where: { batch_id: batch.batch_id },
        data: { quantity: { decrement: total_items } },
      });

      const updatedBatch = await tx.product_batches.findFirst({
        where: { batch_id: batch.batch_id },
        select: { quantity: true }
      });
      console.log(`📈 Stock after reservation - Batch ID: ${batch.batch_id}, New quantity: ${updatedBatch?.quantity}`);

      return newGroup;
    });

    console.log("🎉 Group Buying created successfully:", result);
    res.status(201).json({ message: "สร้าง Group Buying สำเร็จ", group: result });

  } catch (error) {
    console.error("❌ Create group buying error:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการสร้าง Group Buying",
    });
  }
});

export default creategroupRoute;
