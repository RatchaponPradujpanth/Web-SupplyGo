import { Router, Request, Response } from 'express';
import { authadmin, authenticateToken } from '../middleware/authMiddleware';
import { Prisma, PrismaClient } from "@prisma/client";

const createcategoriesRoute = Router();
const prisma = new PrismaClient();

createcategoriesRoute.post("/createcategories",authenticateToken,authadmin,async (req : Request , res : Response) => {
    const {category_name,description} = req.body;
    try {
        
    const newcategory = await prisma.product_categories.create({
        data :{ 
            category_name,
            description,
        }
    })    

    res.status(201).json({
        message: "บันทึก category สำเร็จ",
        category: newcategory, // ✅ ส่งข้อมูล category กลับไปด้วยจะใช้งานง่ายขึ้น
      });
    } catch (error) {
        console.error("บันทึก category ไม่สำเร็จ:", error);
        res.status(500).json({ message: "บันทึก category ไม่สำเร็จ" });
    }
})

export default createcategoriesRoute;