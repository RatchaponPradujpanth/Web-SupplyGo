import { Router, Request, Response } from "express";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const primarypictureRoute = Router();
const prisma = new PrismaClient();

// PATCH method เดิม
primarypictureRoute.patch('/primary-picture', async (req: Request, res: Response) => {
    console.log('🎯 PATCH /primary-picture called!', req.body);
    
    const { productId, imageId } = req.body;
    
    if (!productId || !imageId) {
        res.status(400).json({ error: 'productId และ imageId ต้องระบุ' });
        return 
    }
    
    try {
        console.log('🔄 Starting database operations...');
        
        await prisma.product_images.updateMany({
            where: {
                product_id: productId,
                is_primary: true,
            },
            data: {
                is_primary: false,
            },
        });

        await prisma.product_images.update({
  where: {
    product_images_id: imageId,
  },
  data: {
    is_primary: true,
  },
});
        
        console.log('✅ Database operations completed');
        res.json({ message: "อัพเดทรูปหลักแล้ว" });
        
    } catch (error) {
        console.error('❌ Error setting primary image:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตั้งรูปหลัก' });
    }
});

export default primarypictureRoute;