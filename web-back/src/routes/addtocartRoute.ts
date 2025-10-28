import { Router, Request, Response } from "express";
import uploadProductImage from "../middleware/uploadProductImage";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const addproductRoute = Router();
const prisma = new PrismaClient();

/* ===============================
   🧩 Interfaces สำหรับโครงสร้างข้อมูล
   =============================== */

interface ProductOptionInput {
  name: string;
}

interface ProductVariantInput {
  sku: string;
  price: string | number;
  option_values: string[];
}

interface ProductBatchInput {
  batch_number?: string;
  manufactured_date?: string;
  expiry_date?: string;
  quantity: number | string;
}

interface AddProductBody {
  product_name: string;
  product_description?: string;
  price: string;
  category_id: string;
  options?: ProductOptionInput[] | string;
  variants?: ProductVariantInput[] | string;
  batches?: ProductBatchInput[][] | ProductBatchInput[] | string;
}

/* ===============================
   🧑‍💼 Interface สำหรับ user จาก token
   =============================== */
interface AuthUser {
  user_id: number;
  shop_id: number;
  role: string;
}

/* ===============================
   🚀 Route: เพิ่มสินค้า
   =============================== */

addproductRoute.post(
  "/add-product",
  authenticateToken,
  authstore,
  uploadProductImage.array("images", 5),
  async (req: Request<{}, {}, AddProductBody>, res: Response): Promise<void> => {
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
      const user = req.user as AuthUser;

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

      // ✅ สร้าง Product หลัก
      const newProduct = await prisma.products.create({
        data: {
          product_name,
          product_description,
          price: parseFloat(price),
          category_id: parseInt(category_id),
          status: "active",
        },
      });

      // ✅ บันทึกรูปภาพสินค้า
      const imageRecords = files.map((file, index) => ({
        product_id: newProduct.product_id,
        image_url: `/upload/products/${file.filename}`,
        is_primary: index === 0,
        sort_order: index + 1,
      }));

      await prisma.product_images.createMany({ data: imageRecords });

      // ✅ ผูกสินค้าเข้ากับร้านของ user
      await prisma.product_owners.create({
        data: {
          shop_id: user.shop_id,
          product_id: newProduct.product_id,
        },
      });

      // ✅ แปลง JSON เป็น Object พร้อมระบุ Type
      const parsedOptions: ProductOptionInput[] =
        typeof options === "string" ? JSON.parse(options) : options || [];

      const parsedVariants: ProductVariantInput[] =
        typeof variants === "string" ? JSON.parse(variants) : variants || [];

      const parsedBatches: ProductBatchInput[][] | ProductBatchInput[] =
        typeof batches === "string" ? JSON.parse(batches) : batches || [];

      console.log("📦 Parsed data:", {
        options: parsedOptions,
        variants: parsedVariants,
        batches: parsedBatches,
      });

      // ✅ ตรวจสอบว่ามี Variants หรือไม่
      const hasVariants =
        parsedVariants.length > 0 && parsedOptions.length > 0;

      if (hasVariants) {
        /* ==========================
           🎯 กรณีมี Variants
           ========================== */

        // ✅ สร้าง Options
        const createdOptions = await Promise.all(
          parsedOptions.map((opt) =>
            prisma.product_options.create({
              data: {
                name: opt.name,
                product_id: newProduct.product_id,
              },
            })
          )
        );

        // ✅ Map ชื่อ option → option_id
        const optionMap = new Map<string, number>();
        createdOptions.forEach((opt) => {
          optionMap.set(opt.name, opt.option_id);
        });

        // ✅ สร้าง Variants และ Variant Options
        const createdVariants: Record<string, number> = {}; // เก็บ variant_id ตาม sku

        for (const variant of parsedVariants) {
          const createdVariant = await prisma.product_variants.create({
            data: {
              product_id: newProduct.product_id,
              sku: variant.sku,
              price: parseFloat(variant.price as string),
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
            const variantBatches =
              (parsedBatches as ProductBatchInput[][])[i] || [];

            if (variantBatches.length > 0) {
              const batchRecords = variantBatches.map((b) => ({
                product_id: null,
                variant_id,
                batch_number: b.batch_number || null,
                manufactured_date: b.manufactured_date
                  ? new Date(b.manufactured_date)
                  : null,
                expiry_date: b.expiry_date
                  ? new Date(b.expiry_date)
                  : null,
                quantity: Number(b.quantity) || 0,
              }));

              await prisma.product_batches.createMany({ data: batchRecords });
            }
          }
        }
      } else {
        /* ==========================
           🎯 กรณีสินค้าธรรมดา (ไม่มี variant)
           ========================== */

        if (parsedBatches && parsedBatches.length > 0) {
          // แปลงให้เป็น array เดียวถ้ามี nested array
          const batchesToCreate = Array.isArray(parsedBatches[0])
            ? (parsedBatches[0] as ProductBatchInput[])
            : (parsedBatches as ProductBatchInput[]);

          if (batchesToCreate.length > 0) {
            const batchRecords = batchesToCreate.map((b) => ({
              product_id: newProduct.product_id,
              variant_id: null,
              batch_number: b.batch_number || null,
              manufactured_date: b.manufactured_date
                ? new Date(b.manufactured_date)
                : null,
              expiry_date: b.expiry_date ? new Date(b.expiry_date) : null,
              quantity: Number(b.quantity) || 0,
            }));

            await prisma.product_batches.createMany({ data: batchRecords });
          }
        }
      }

      res.status(201).json({
        message: "เพิ่มสินค้าพร้อมตัวเลือก, รูปภาพ และ batch สำเร็จ",
        product_id: newProduct.product_id,
        hasVariants,
      });
    } catch (error) {
      console.error("❌ เพิ่มสินค้า error:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดขณะเพิ่มสินค้า" });
    }
  }
);

export default addproductRoute;
