import { Router, Request, Response } from "express";
import uploadProductImage from "../middleware/uploadProductImage";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const addproductRoute = Router();
const prisma = new PrismaClient();

addproductRoute.post(
  "/add-product",
  authenticateToken,authstore,
  uploadProductImage.array("images", 5),
  async (req: Request, res: Response) => {
    try {
      const {
        product_name,
        product_description,
        price,
        category_id,
        options,
        variants,
        batches, 
      } = req.body;

      const files = req.files as Express.Multer.File[];
      const user = req.user as { user_id: number; shop_id: number; role: string };

      // ตรวจสิทธิ์
      if (user.role !== "store") {
        res.status(403).json({ message: "คุณไม่มีสิทธิในการเพิ่มสินค้า" });
        return;
      }

      // ตรวจรูป
      if (!files || files.length === 0) {
        res.status(400).json({ message: "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป" });
        return;
      }

      // สร้าง Product
      const newProduct = await prisma.products.create({
        data: {
          product_name,
          product_description,
          price: parseFloat(price),
          category_id: parseInt(category_id),
          status: "active",
        },
      });

      //สร้าง Images
      const imageRecords = files.map((file, index) => ({
        product_id: newProduct.product_id,
        image_url: `/upload/products/${file.filename}`,
        is_primary: index === 0,
        sort_order: index + 1,
      }));
      await prisma.product_images.createMany({ data: imageRecords });

      // ผูกกับร้าน
      await prisma.product_owners.create({
        data: {
          shop_id: user.shop_id,
          product_id: newProduct.product_id,
        },
      });

      // แปลง options / variants / batches
      const parsedOptions = typeof options === "string" ? JSON.parse(options) : options || [];
      const parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants || [];
      const parsedBatches = typeof batches === "string" ? JSON.parse(batches) : batches || [];

      console.log("📦 Parsed data:", {
        options: parsedOptions,
        variants: parsedVariants,
        batches: parsedBatches
      });

      // ✅ ตรวจสอบว่ามี variants หรือไม่
      const hasVariants = parsedVariants.length > 0 && parsedOptions.length > 0;

      if (hasVariants) {
        // 🎯 กรณีมี Variants
        
        // สร้าง Options
        const createdOptions = await Promise.all(
          parsedOptions.map((opt: any) =>
            prisma.product_options.create({
              data: {
                name: opt.name,
                product_id: newProduct.product_id,
              },
            })
          )
        );

        // Mapping option name → option_id
        const optionMap = new Map<string, number>();
        createdOptions.forEach((opt) => {
          optionMap.set(opt.name, opt.option_id);
        });

        // สร้าง Variants + Variant Options
        const createdVariants: { [key: string]: number } = {}; // เก็บ variant_id ตาม sku
        for (const variant of parsedVariants) {
          const createdVariant = await prisma.product_variants.create({
            data: {
              product_id: newProduct.product_id,
              sku: variant.sku,
              price: parseFloat(variant.price),
            },
          });

          createdVariants[variant.sku] = createdVariant.variant_id;

          // เพิ่ม Variant Options
          for (let i = 0; i < variant.option_values.length; i++) {
            const optionName = parsedOptions[i].name;
            const value = variant.option_values[i];
            const option_id = optionMap.get(optionName);

            if (option_id) {
              await prisma.variant_options.create({
                data: {
                  variant_id: createdVariant.variant_id,
                  option_id,
                  value,
                },
              });
            }
          }
        }

        // ✅ สร้าง Batches สำหรับ Variants (รองรับ 2D array)
        if (parsedBatches && parsedBatches.length > 0) {
          for (let i = 0; i < parsedVariants.length; i++) {
            const variant = parsedVariants[i];
            const variant_id = createdVariants[variant.sku];
            const variantBatches = parsedBatches[i] || []; // batches ของ variant นี้

            if (variantBatches.length > 0) {
              const batchRecords = variantBatches.map((b: any) => ({
                product_id: null, // สินค้าที่มี variant จะใส่ null
                variant_id: variant_id,
                batch_number: b.batch_number || null,
                manufactured_date: b.manufactured_date ? new Date(b.manufactured_date) : null,
                expiry_date: b.expiry_date ? new Date(b.expiry_date) : null,
                quantity: parseInt(b.quantity) || 0,
              }));

              await prisma.product_batches.createMany({ data: batchRecords });
            }
          }
        }

      } else {
        // 🎯 กรณีสินค้าธรรมดา (ไม่มี variant)
        
        // ✅ สร้าง Batches สำหรับสินค้าธรรมดา
        if (parsedBatches && parsedBatches.length > 0) {
          // สำหรับสินค้าธรรมดา batches อาจเป็น 1D array หรือ 2D array[0]
          const batchesToCreate = Array.isArray(parsedBatches[0]) ? parsedBatches[0] : parsedBatches;
          
          if (batchesToCreate.length > 0) {
            const batchRecords = batchesToCreate.map((b: any) => ({
              product_id: newProduct.product_id, // สินค้าธรรมดาใส่ product_id
              variant_id: null, // ไม่มี variant ใส่ null
              batch_number: b.batch_number || null,
              manufactured_date: b.manufactured_date ? new Date(b.manufactured_date) : null,
              expiry_date: b.expiry_date ? new Date(b.expiry_date) : null,
              quantity: parseInt(b.quantity) || 0,
            }));

            await prisma.product_batches.createMany({ data: batchRecords });
          }
        }
      }

      res.status(201).json({
        message: "เพิ่มสินค้าพร้อมตัวเลือก, รูปภาพ และ batch สำเร็จ",
        product_id: newProduct.product_id,
        hasVariants: hasVariants,
      });
    } catch (error) {
      console.error("❌ เพิ่มสินค้า error:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดขณะเพิ่มสินค้า" });
    }
  }
);

export default addproductRoute;