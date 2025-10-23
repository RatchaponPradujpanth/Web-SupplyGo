import { Router, Request, Response } from "express";
import uploadProductImage from "../middleware/uploadProductImage";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const addproductRoute = Router();
const prisma = new PrismaClient();

addproductRoute.post("/addproduct", authenticateToken, authstore, uploadProductImage.array('images', 10), async (req: any, res: any) => {
  console.log("🔍 Starting addproduct process...");
  console.log("📝 Request body:", req.body);
  console.log("📁 Files:", req.files);
  console.log("👤 User from token:", req.user);

  try {
    const userId = req.user?.user_id;
    const shopId = req.user?.shop_id;

    if (!userId) {
      console.error("❌ No user ID in token");
      return res.status(401).json({ message: "ไม่พบ user ID ใน token" });
    }

    if (!shopId) {
      console.error("❌ No shop ID in token");
      return res.status(403).json({ message: "ไม่พบข้อมูลร้านค้า" });
    }

    console.log("👤 User ID from token:", userId);
    console.log("🏪 Shop ID from token:", shopId);

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
    if (!product_name || !price || !category_id) {
      console.error("❌ Missing required fields");
      return res.status(400).json({ 
        message: "กรุณากรอกข้อมูลที่จำเป็น",
        missing: {
          product_name: !product_name,
          price: !price,
          category_id: !category_id
        }
      });
    }

    // middleware authstore จะตรวจสอบ role = "store" และ shop_id ให้แล้ว
    console.log("✅ User is authorized as store owner");

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
      const newProduct = await prisma.products.create({
        data: {
          product_name,
          product_description,
          price: parseFloat(price),
          category_id: parseInt(category_id),
          status: "active"
        },
      });

      console.log("✅ Product created successfully:", newProduct.product_id);

      // สร้าง shop ownership
      const userShop = await prisma.shops.findFirst({
        where: { user_id: parseInt(userId) }
      });

      if (userShop) {
        await prisma.product_owners.create({
          data: {
            shop_id: userShop.shop_id,
            product_id: newProduct.product_id
          }
        });
        console.log("✅ Product ownership created");
      }

      // หากมีไฟล์รูปภาพ ให้บันทึกลงฐานข้อมูล
      if (req.files && req.files.length > 0) {
        console.log("📸 Uploading product images...");
        try {
          for (const file of req.files) {
            await prisma.product_images.create({
              data: {
                product_id: newProduct.product_id,
                image_url: file.filename,
                is_primary: false
              },
            });
          }
          console.log("✅ Product images uploaded successfully");
        } catch (imageError) {
          console.error("❌ Error uploading images:", imageError);
          // ไม่ return error เพราะสินค้าสร้างแล้ว
        }
      }

      // บันทึก batches (จำนวนสินค้า)
      if (parsedBatches && parsedBatches.length > 0) {
        console.log("📦 Processing batches...");
        
        // ถ้าไม่มี variants ให้สร้าง default variant
        if (parsedVariants.length === 0) {
          console.log("🔄 No variants, creating default variant...");
          const defaultVariant = await prisma.product_variants.create({
            data: {
              product_id: newProduct.product_id,
              sku: `DEFAULT-${newProduct.product_id}`,
              price: parseFloat(price)
            }
          });
          console.log("✅ Default variant created:", defaultVariant.variant_id);

          // บันทึก batches สำหรับ default variant
          if (parsedBatches[0] && Array.isArray(parsedBatches[0])) {
            let totalQuantity = 0;
            for (const batch of parsedBatches[0]) {
              const qty = parseInt(batch.quantity) || 0;
              
              if (qty > 0) {
                await prisma.product_batches.create({
                  data: {
                    product_id: newProduct.product_id,
                    variant_id: defaultVariant.variant_id,
                    batch_number: batch.batch_number || `BATCH-${Date.now()}`,
                    manufactured_date: batch.manufactured_date ? new Date(batch.manufactured_date) : null,
                    expiry_date: batch.expiry_date ? new Date(batch.expiry_date) : null,
                    quantity: qty
                  }
                });
                totalQuantity += qty;
                console.log(`✅ Batch created: ${batch.batch_number} with quantity: ${qty}`);
              } else {
                console.warn(`⚠️ Skipping batch with invalid quantity: ${batch.quantity}`);
              }
            }
            console.log(`📊 Total stock quantity: ${totalQuantity}`);
            
            if (totalQuantity === 0) {
              console.warn("⚠️ WARNING: Product has 0 stock! Please add quantity in batches.");
            }
          }
        }
      } else {
        console.warn("⚠️ No batches provided! Product will have 0 stock.");
      }

      res.status(201).json({
        message: "เพิ่มสินค้าสำเร็จ",
        product: newProduct,
      });
    } catch (productError) {
      console.error("❌ Error creating product:", productError);
      return res.status(500).json({ 
        message: "เกิดข้อผิดพลาดในการสร้างสินค้า",
        error: productError instanceof Error ? productError.message : "Unknown error"
      });
    }

  } catch (error) {
    console.error("❌ Unexpected error in addproduct:", error);
    res.status(500).json({ 
      message: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default addproductRoute;