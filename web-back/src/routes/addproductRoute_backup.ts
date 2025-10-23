import { Router, Request, Response } from "express";
import uploadProductImage from "../middleware/uploadProductImage";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const addproductRoute = Router();
const prisma = new PrismaClient();

router.post("/addproduct", authenticateToken, upload, async (req: any, res: any) => {
  console.log("� Starting addproduct process...");
  console.log("� Request body:", req.body);
  console.log("📁 Files:", req.files);

  try {
    const userId = req.user?.id;

    if (!userId) {
      console.error("❌ No user ID in token");
      return res.status(401).json({ message: "ไม่พบ user ID ใน token" });
    }

    console.log("👤 User ID from token:", userId);

    const {
      product_name,
      product_description,
      price,
      category_id,
      target_amount,
      end_time,
      max_group_size,
      quantity,
      options,
      variants,
      batches,
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!product_name || !price || !category_id || !quantity) {
      console.error("❌ Missing required fields");
      return res.status(400).json({ 
        message: "กรุณากรอกข้อมูลที่จำเป็น",
        missing: {
          product_name: !product_name,
          price: !price,
          category_id: !category_id,
          quantity: !quantity
        }
      });
    }

    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของร้าน
    try {
      const userResult = await prisma.$queryRaw<{ role: string }[]>`
        SELECT role FROM "User" WHERE id = ${parseInt(userId)}
      `;

      if (!userResult || userResult.length === 0) {
        console.error("❌ User not found");
        return res.status(404).json({ message: "ไม่พบผู้ใช้" });
      }

      if (userResult[0].role !== "shop") {
        console.error("❌ User is not a shop owner:", userResult[0].role);
        return res.status(403).json({ message: "ไม่มีสิทธิ์เพิ่มสินค้า คุณไม่ใช่เจ้าของร้าน" });
      }

      console.log("✅ User is a shop owner");
    } catch (dbError) {
      console.error("❌ Database error checking user role:", dbError);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์" });
    }

    // แปลง options / variants / batches
    let parsedOptions = [];
    let parsedVariants = [];
    let parsedBatches = [];

    try {
      parsedOptions = typeof options === "string" ? JSON.parse(options) : options || [];
      parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants || [];
      parsedBatches = typeof batches === "string" ? JSON.parse(batches) : batches || [];
    } catch (parseError) {
      console.error("❌ JSON parsing error:", parseError);
      return res.status(400).json({ message: "ข้อมูล JSON ไม่ถูกต้อง" });
    }

    console.log("📦 Parsed data:", {
      options: parsedOptions,
      variants: parsedVariants,
      batches: parsedBatches
    });

    // สร้างสินค้าใหม่
    console.log("💾 Creating product...");
    try {
      const newProduct = await prisma.product.create({
        data: {
          product_name,
          product_description,
          price: parseFloat(price),
          category_id: parseInt(category_id),
          target_amount: target_amount ? parseInt(target_amount) : null,
          end_time: end_time ? new Date(end_time) : null,
          max_group_size: max_group_size ? parseInt(max_group_size) : null,
          quantity: parseInt(quantity),
          user_id: parseInt(userId),
          ...(parsedOptions.length > 0 && { options: parsedOptions }),
          ...(parsedVariants.length > 0 && { variants: parsedVariants }),
          ...(parsedBatches.length > 0 && { batches: parsedBatches }),
        },
      });

      console.log("✅ Product created successfully:", newProduct.id);

      // หากมีไฟล์รูปภาพ ให้บันทึกลงฐานข้อมูล
      if (req.files && req.files.length > 0) {
        console.log("📸 Uploading product images...");
        try {
          for (const file of req.files) {
            await prisma.productPicture.create({
              data: {
                product_id: newProduct.id,
                picture_url: file.filename,
              },
            });
          }
          console.log("✅ Product images uploaded successfully");
        } catch (imageError) {
          console.error("❌ Error uploading images:", imageError);
          // ไม่ return error เพราะสินค้าสร้างแล้ว
        }
      }

      res.status(201).json({
        message: "เพิ่มสินค้าสำเร็จ",
        product: newProduct,
      });
    } catch (productError) {
      console.error("❌ Error creating product:", productError);
      return res.status(500).json({ 
        message: "เกิดข้อผิดพลาดในการสร้างสินค้า",
        error: productError.message 
      });
    }

  } catch (error) {
    console.error("❌ Unexpected error in addproduct:", error);
    res.status(500).json({ 
      message: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
      error: error.message 
    });
  }
});

export default addproductRoute;