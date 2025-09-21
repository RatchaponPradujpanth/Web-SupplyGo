// import { Router, Request, Response } from 'express';
// import { authenticateToken, authstore } from '../../../middleware/authMiddleware';
// import { PrismaClient } from "@prisma/client";

// const confirmgroupRoute = Router();
// const prisma = new PrismaClient();

// confirmgroupRoute.post("/confirm-group",authenticateToken,authstore,async(req : Request , res : Response)=>{
//     const { group_buying_id, product_id, total_items, status } = req.body;

//      if (!group_buying_id || !product_id || !total_items) {
//         res.status(400).json({ message: "ข้อมูลไม่ครบ" });
//         return 
//     }

//     try {
//     const groupOrder = await prisma.$transaction(async (tx) => {
//       // 🔎 หา batch ของสินค้าที่มี stock เพียงพอ เรียงตาม expiry_date
//       const batch = await tx.product_batches.findFirst({
//         where: {
//           product_id,
//           variant_id: variant_id || undefined,
//           quantity: { gte: total_items },
//         },
//         orderBy: { expiry_date: "asc" },
//       });

//       if (!batch) {
//         throw new Error("Stock สินค้าไม่เพียงพอ");
//       }

//       // ✅ สร้าง group_order + group_order_item โดยไม่ลด stock
//       const newOrder = await tx.group_order.create({
//         data: {
//           group_id: group_buying_id,
//           total_amount: total_items * (batch.product?.price || 0),
//           status: status || "pending",
//           items: {
//             create: [
//               {
//                 product_id,
//                 quantity: total_items,
//                 price_per_unit: batch.product?.price || 0,
//               },
//             ],
//           },
//         },
//         include: { items: true },
//       });

//       return newOrder;
//     });

//     res.status(201).json({ message: "สร้าง Group Order สำเร็จ ✅", groupOrder });
//   } catch (error: any) {
//     console.error("❌ Error creating group order:", error);
//     res.status(500).json({ message: error.message || "เกิดข้อผิดพลาด" });
//   }

// })