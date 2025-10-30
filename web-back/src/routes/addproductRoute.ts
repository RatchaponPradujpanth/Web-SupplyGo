import { Router, Request, Response } from "express";
import uploadProductImage from "../middleware/uploadProductImage";
import { authenticateToken, authstore } from "../middleware/authMiddleware";
import { PrismaClient } from "@prisma/client";

const addproductRoute = Router();
const prisma = new PrismaClient();

addproductRoute.post("/addproduct", authenticateToken, authstore, uploadProductImage.array('images', 10), async (req: Request, res: Response) => {

  try {
    const userId = req.user?.user_id;
    const shopId = req.user?.shop_id;

    if (!userId) {
      console.error("❌ No user ID in token");
       res.status(401).json({ message: "ไม่พบ user ID ใน token" });
       return
    }

    if (!shopId) {
      console.error("❌ No shop ID in token");
       res.status(403).json({ message: "ไม่พบข้อมูลร้านค้า" });
      return
    }

    console.log("👤 User ID from token:", userId);
    console.log("🏪 Shop ID from token:", shopId);

    const {
      product_name,
      product_description,
      price,
      category_id,
      options,
      variants,
      batches,
    } = req.body;

    if (!product_name || !price || !category_id) {
      console.error("❌ Missing required fields");
      res.status(400).json({ 
        message: "กรุณากรอกข้อมูลที่จำเป็น",
        missing: {
          product_name: !product_name,
          price: !price,
          category_id: !category_id
        }
      });
      return;
    }

    console.log("✅ User is authorized as store owner");

    let parsedOptions = [];
    let parsedVariants = [];
    let parsedBatches = [];

    try {
      parsedOptions = typeof options === "string" ? JSON.parse(options) : options || [];
      parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants || [];
      parsedBatches = typeof batches === "string" ? JSON.parse(batches) : batches || [];
    } catch (parseError) {
      console.error("❌ JSON parsing error:", parseError);
       res.status(400).json({ message: "ข้อมูล JSON ไม่ถูกต้อง" });
      return
    }

    console.log("📦 Parsed data:", {
      options: parsedOptions,
      variants: parsedVariants,
      batches: parsedBatches
    });

    console.log("🔍 Checking for duplicate product name in shop...");
    const existingProduct = await prisma.product_owners.findFirst({
      where: {
        shop_id: shopId,
        products: {
          product_name: product_name.trim()
        }
      },
      include: {
        products: {
          select: {
            product_id: true,
            product_name: true
          }
        }
      }
    });

    if (existingProduct) {
      console.error("❌ Product name already exists in this shop");
       res.status(409).json({ 
        message: `สินค้าชื่อ "${product_name}" มีอยู่ในร้านแล้ว`,
        existing_product_id: existingProduct.products.product_id
      });
      return;
    }

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

      const userIdNumber = typeof userId === 'string' ? parseInt(userId) : userId;
      const userShop = await prisma.shops.findFirst({ where: { user_id: userIdNumber } });

      if (userShop) {
        await prisma.product_owners.create({
          data: {
            shop_id: userShop.shop_id,
            product_id: newProduct.product_id
          }
        });
        console.log("✅ Product ownership created");
      }

      const uploadedFiles = req.files as Express.Multer.File[];
      if (uploadedFiles && uploadedFiles.length > 0) {
        console.log("📸 Uploading product images...");
        try {
          for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const imagePath = `/uploads/products/${file.filename}`;
            
            await prisma.product_images.create({
              data: {
                product_id: newProduct.product_id,
                image_url: imagePath,
                is_primary: i === 0,
                sort_order: i
              },
            });
            console.log(`✅ Image ${i + 1} saved: ${imagePath} (primary: ${i === 0})`);
          }
          console.log("✅ Product images uploaded successfully");
        } catch (imageError) {
          console.error("❌ Error uploading images:", imageError);
        }
      } else {
        console.warn("⚠️ No images provided for product");
      }

      // ✅ กรณีที่มี variants (สินค้ามีตัวเลือก)
      if (parsedOptions.length > 0 && parsedVariants.length > 0) {
        console.log("🎨 Creating product options and variants...");
        
        const createdOptions: { [key: string]: number } = {};
        for (const opt of parsedOptions) {
          if (opt.name && opt.values && opt.values.length > 0) {
            const productOption = await prisma.product_options.create({
              data: {
                product_id: newProduct.product_id,
                name: opt.name
              }
            });
            createdOptions[opt.name] = productOption.option_id;
            console.log(`✅ Created option: ${opt.name} (ID: ${productOption.option_id})`);
          }
        }

        for (let i = 0; i < parsedVariants.length; i++) {
          const variantData = parsedVariants[i];
          
          const variant = await prisma.product_variants.create({
            data: {
              product_id: newProduct.product_id,
              sku: variantData.sku || `VAR-${newProduct.product_id}-${i + 1}`,
              price: parseFloat(variantData.price) || parseFloat(price)
            }
          });
          console.log(`✅ Created variant: ${variant.sku} (ID: ${variant.variant_id})`);

          if (variantData.option_values && Array.isArray(variantData.option_values)) {
            for (let j = 0; j < variantData.option_values.length; j++) {
              const optValue = variantData.option_values[j];
              const optName = parsedOptions[j]?.name;
              
              if (optName && createdOptions[optName]) {
                await prisma.variant_options.create({
                  data: {
                    variant_id: variant.variant_id,
                    option_id: createdOptions[optName],
                    value: optValue
                  }
                });
                console.log(`✅ Linked variant option: ${optName} = ${optValue}`);
              }
            }
          }

          // ✅ สร้าง batch สำหรับแต่ละ variant
          if (parsedBatches[i] && Array.isArray(parsedBatches[i])) {
            let totalQuantity = 0;
            for (const batch of parsedBatches[i]) {
              const qty = parseInt(batch.quantity) || parseInt(variantData.stock_quantity) || 0;
              
              if (qty > 0) {
                await prisma.product_batches.create({
                  data: {
                    product_id: null,              // ✅ มี variant → product_id = null
                    variant_id: variant.variant_id, // ✅ เก็บที่ variant_id
                    batch_number: batch.batch_number || `BATCH-${variant.variant_id}-${Date.now()}`,
                    manufactured_date: batch.manufactured_date ? new Date(batch.manufactured_date) : null,
                    expiry_date: batch.expiry_date ? new Date(batch.expiry_date) : null,
                    quantity: qty
                  }
                });
                totalQuantity += qty;
                console.log(`✅ Batch created for variant ${variant.sku}: quantity ${qty}`);
              }
            }
            console.log(`📊 Total stock for variant ${variant.sku}: ${totalQuantity}`);
          }
        }
        
        console.log("✅ All variants and options created successfully!");
      }
      // ✅ กรณีที่ไม่มี variants (สินค้าธรรมดา)
      else if (parsedBatches && parsedBatches.length > 0) {
        console.log("📦 Processing batches for simple product (no variants)...");
        
        // ❌ ลบส่วนสร้าง default variant ออก!
        // ไม่ต้องสร้าง product_variants เลยสำหรับสินค้าธรรมดา
        
        if (parsedBatches[0] && Array.isArray(parsedBatches[0])) {
          let totalQuantity = 0;
          for (const batch of parsedBatches[0]) {
            const qty = parseInt(batch.quantity) || 0;
            
            if (qty > 0) {
              await prisma.product_batches.create({
                data: {
                  product_id: newProduct.product_id, // ✅ ไม่มี variant → เก็บ product_id
                  variant_id: null,                  // ✅ variant_id = null
                  batch_number: batch.batch_number || `BATCH-${newProduct.product_id}-${Date.now()}`,
                  manufactured_date: batch.manufactured_date ? new Date(batch.manufactured_date) : null,
                  expiry_date: batch.expiry_date ? new Date(batch.expiry_date) : null,
                  quantity: qty
                }
              });
              totalQuantity += qty;
              console.log(`✅ Batch created for product ${newProduct.product_id}: ${batch.batch_number} with quantity: ${qty}`);
            } else {
              console.warn(`⚠️ Skipping batch with invalid quantity: ${batch.quantity}`);
            }
          }
          console.log(`📊 Total stock for simple product: ${totalQuantity}`);
          
          if (totalQuantity === 0) {
            console.warn("⚠️ WARNING: Product has 0 stock! Please add quantity in batches.");
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
       res.status(500).json({ 
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