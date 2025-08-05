import { Router, Request, Response } from "express";
import uploadProductImage from "../middleware/uploadProductImage";
import { authenticateToken } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const addproductRoute = Router();
const prisma = new PrismaClient();

addproductRoute.post(
  "/add-product",
  authenticateToken,
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
      } = req.body;

      const files = req.files as Express.Multer.File[];
      const user = req.user as { user_id: number; shop_id: number; role: string };

      if (user.role !== "store") {
        res.status(403).json({ message: "คุณไม่มีสิทธิในการเพิ่มสินค้า" });
        return 
      }

      if (!files || files.length === 0) {
        res.status(400).json({ message: "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป" });
        return 
      }

      const newProduct = await prisma.products.create({
        data: {
          product_name,
          product_description,
          price: parseFloat(price),
          category_id: parseInt(category_id),
          status: "active",
        },
      });

      // เพิ่มรูปภาพ
      const imageRecords = files.map((file, index) => ({
        product_id: newProduct.product_id,
        image_url: `/upload/products/${file.filename}`,
        is_primary: index === 0,
        sort_order: index + 1,
      }));
      await prisma.product_images.createMany({ data: imageRecords });

      // ผูกเจ้าของสินค้า
      await prisma.product_owners.create({
        data: {
          shop_id: user.shop_id,
          product_id: newProduct.product_id,
        },
      });

      // แปลง options เป็น array ก่อนใช้ (ถ้าส่งเป็น JSON string)
      const parsedOptions = typeof options === "string" ? JSON.parse(options) : options;
      const parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;

      // เพิ่ม options เช่น สี, ขนาด
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

      // Mapping ตัวเลือกไว้ใช้กับ variant later
      const optionMap = new Map<string, number>();
      createdOptions.forEach((opt) => {
        optionMap.set(opt.name, opt.option_id);
      });

      // เพิ่ม variants เช่น RED-S พร้อม variant_options
      for (const variant of parsedVariants) {
        const createdVariant = await prisma.product_variants.create({
          data: {
            product_id: newProduct.product_id,
            sku: variant.sku,
            price: parseFloat(variant.price),
            stock_quantity: parseInt(variant.stock_quantity),
          },
        });

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

      res.status(201).json({
        message: "เพิ่มสินค้าพร้อมตัวเลือกและรูปภาพสำเร็จ",
        product_id: newProduct.product_id,
      });
    } catch (error) {
      console.error("❌ เพิ่มสินค้า error:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดขณะเพิ่มสินค้า" });
    }
  }
);

export default addproductRoute;