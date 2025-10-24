import { Router, Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../../middleware/authMiddleware';

dotenv.config();
const prisma = new PrismaClient();

const cancelorderRoute = Router();

cancelorderRoute.post("/cancelorder/:orderId", authenticateToken, async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        
        if (!orderId || isNaN(Number(orderId))) {
            res.status(400).json({ error: "Order ID ไม่ถูกต้อง" });
            return;
        }

        const orderShop = await prisma.order_shops.findMany({
            where: {
                order_id: Number(orderId)
            },
            select: {
                order_shop_id: true,
                status: true,
            }
        });

        if (!orderShop.length) {
            res.status(400).json({ error: "หา order id ไม่เจอ" });
            return;
        }

        if (orderShop.some(shop => shop.status === 'cancelled')) {
            res.status(400).json({ error: "Order นี้ถูกยกเลิกไปแล้ว" });
            return;
        }

        await prisma.order_shops.updateMany({
            where: {
                order_id: Number(orderId),
            },
            data: {
                status: "cancelled"
            }
        });

        console.log(`🔍 Processing order ${orderId}`);

        for (const shop of orderShop) {
            const items = await prisma.order_items.findMany({
                where: {
                    order_shop_id: shop.order_shop_id,
                },
            });

            console.log(`📝 Found ${items.length} items in shop ${shop.order_shop_id}`);

            for (const item of items) {
                console.log(`🔍 Processing item:`, {
                    product_id: item.product_id,
                    variant_option_id: item.variant_option_id,
                    quantity: item.quantity
                });

                // ตรวจสอบว่าเป็นสินค้าที่มี variant หรือไม่
                if (item.variant_option_id) {
                    // สินค้าที่มี variant -> ใช้ variant_id, product_id = null
                    console.log(`🎯 Product with variant - Getting variant_id from variant_option_id: ${item.variant_option_id}`);
                    
                    const variantOption = await prisma.variant_options.findUnique({
                        where: {
                            variant_option_id: item.variant_option_id
                        },
                        select: {
                            variant_id: true
                        },
                    });

                    if (!variantOption) {
                        console.log(`❌ Variant option ${item.variant_option_id} not found`);
                        continue;
                    }

                    const variantId = variantOption.variant_id;
                    console.log(`🔗 Found variant_id: ${variantId}`);

                    // สำหรับสินค้าที่มี variant: product_id = null, variant_id = มีค่า
                    const whereCondition = {
                        product_id: null,
                        variant_id: variantId
                    };

                    console.log(`🔍 Where condition (variant):`, whereCondition);

                    const existingBatches = await prisma.product_batches.findMany({
                        where: whereCondition,
                        select: {
                            batch_id: true,
                            quantity: true,
                            product_id: true,
                            variant_id: true
                        }
                    });

                    console.log(`📦 Found ${existingBatches.length} matching variant batches`);

                    if (existingBatches.length === 0) {
                        // สร้าง batch ใหม่สำหรับ variant
                        console.log(`➕ Creating new batch for variant_id: ${variantId}`);
                        
                        const newBatch = await prisma.product_batches.create({
                            data: {
                                product_id: null,  // สำคัญ: product_id = null สำหรับ variant
                                variant_id: variantId,
                                quantity: item.quantity ?? 0,
                                batch_number: `CANCEL-V${variantId}-${Date.now()}`
                            }
                        });
                        
                        console.log(`✅ Created new variant batch ${newBatch.batch_id} with quantity ${newBatch.quantity}`);
                    } else {
                        // อัพเดท batch ที่มีอยู่
                        const updateResult = await prisma.product_batches.updateMany({
                            where: whereCondition,
                            data: {
                                quantity: { increment: item.quantity ?? 0 }
                            }
                        });

                        console.log(`✅ Updated ${updateResult.count} variant batches, incremented by ${item.quantity}`);
                    }

                } else {
                    // สินค้าธรรมดา (ไม่มี variant) -> ใช้ product_id, variant_id = null
                    console.log(`🎯 Regular product - Using product_id: ${item.product_id}`);

                    // สำหรับสินค้าธรรมดา: product_id = มีค่า, variant_id = null
                    const whereCondition = {
                        product_id: item.product_id,
                        variant_id: null
                    };

                    console.log(`🔍 Where condition (regular):`, whereCondition);

                    const existingBatches = await prisma.product_batches.findMany({
                        where: whereCondition,
                        select: {
                            batch_id: true,
                            quantity: true,
                            product_id: true,
                            variant_id: true
                        }
                    });

                    console.log(`📦 Found ${existingBatches.length} matching regular batches`);

                    if (existingBatches.length === 0) {
                        // สร้าง batch ใหม่สำหรับสินค้าธรรมดา
                        console.log(`➕ Creating new batch for product_id: ${item.product_id}`);
                        
                        const newBatch = await prisma.product_batches.create({
                            data: {
                                product_id: item.product_id,
                                variant_id: null,  // สำคัญ: variant_id = null สำหรับสินค้าธรรมดา
                                quantity: item.quantity ?? 0,
                                batch_number: `CANCEL-P${item.product_id}-${Date.now()}`
                            }
                        });
                        
                        console.log(`✅ Created new regular batch ${newBatch.batch_id} with quantity ${newBatch.quantity}`);
                    } else {
                        // อัพเดท batch ที่มีอยู่
                        const updateResult = await prisma.product_batches.updateMany({
                            where: whereCondition,
                            data: {
                                quantity: { increment: item.quantity ?? 0 }
                            }
                        });

                        console.log(`✅ Updated ${updateResult.count} regular batches, incremented by ${item.quantity}`);
                    }
                }
            }
        }

        console.log(`✅ Order ${orderId} cancelled successfully with stock returned`);
        res.json({ success: true, status: "cancelled", orderId });

    } catch (error) {
        console.error('❌ Error canceling order:', error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการยกเลิก order" });
    }
});

export default cancelorderRoute;