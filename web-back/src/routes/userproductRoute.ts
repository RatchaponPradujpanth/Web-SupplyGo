import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const userproductRoute = Router();
const prisma = new PrismaClient();

// GET /api/products/:id - ดึงข้อมูลสินค้าตาม ID
userproductRoute.get("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await prisma.products.findUnique({
      where: { product_id: productId },
      include: {
        product_variants: {
          include: {
            variant_options: {
              include: {
                option: true,
              },
            },
            product_batches: true,
          },
        },
        product_images: true,
        product_owners: {
          include: {
            shops: {
              select: {
                shop_id: true,
                shop_name: true,
              },
            },
          },
        },
        product_batches: true,
        product_options: {
          include: {
            variant_options: true,
          },
        },
        product_categories: true,
      },
    });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const host = req.headers.host;
    const protocol = req.protocol;
    const getFullUrl = (path?: string | null) => {
      if (!path) return null;
      // ถ้ามี http:// หรือ https:// อยู่แล้ว ให้ return ตรง ๆ
      if (path.startsWith("http://") || path.startsWith("https://")) return path;
      // ถ้าเป็น path เฉย ๆ ให้เพิ่ม base URL
      return `${protocol}://${host}${path.startsWith("/") ? path : "/" + path}`;
    };

    const productImages = product.product_images.map((img) => ({
      id: img.id,
      image_url: img.image_url, // ✅ ไม่ต้องเพิ่ม full URL ให้ frontend จัดการเอง
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    }));

    const shops = product.product_owners.map((po) => ({
      shop_id: po.shops.shop_id,
      shop_name: po.shops.shop_name,
    }));

    const variants = product.product_variants.map((variant) => {
      const totalStock = variant.product_batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);

      return {
        variant_id: variant.variant_id,
        sku: variant.sku,
        price: variant.price ? Number(variant.price) : null,
        total_stock: totalStock,
        variant_options: variant.variant_options.map((vo) => ({
          variant_option_id: vo.variant_option_id,
          option_name: vo.option.name,
          value: vo.value,
          option_id: vo.option_id,
        })),
      };
    });

    const productOptions = product.product_options.map((opt) => ({
      option_id: opt.option_id,
      name: opt.name,
    }));

    const productBatches = product.product_batches
      .filter(batch => !batch.variant_id)
      .reduce((sum, batch) => sum + (batch.quantity || 0), 0);

    const variantPrices = product.product_variants
      .map((v) => (v.price ? Number(v.price) : null))
      .filter((p): p is number => p !== null);
    const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;

    const formattedProduct = {
      product_id: product.product_id,
      product_name: product.product_name,
      product_description: product.product_description,
      price: product.price ? Number(product.price) : minVariantPrice,
      status: product.status,
      total_stock: productBatches,
      product_images: productImages,
      product_variants: variants,
      product_options: productOptions,
      shops: shops,
      category_name: product.product_categories?.category_name || null,
    };

    res.status(200).json(formattedProduct);
  } catch (error) {
    console.error("❌ Error loading product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userproductRoute.get("/loaduserproduct", async (req: Request, res: Response): Promise<void> => {
  console.log("✅ Loadproduct route called");

  try {
    const foundproduct = await prisma.products.findMany({
      include: {  
        product_variants: {
          include: {
            variant_options: {
              include: {
                option: true,
              },
            },
            product_batches: true,
          },
        },
        product_images: true,
        product_owners: {
          include: {
            shops: {
              select: {
                shop_id: true,
                shop_name: true,
              },
            },
          },
        },
        product_batches: true,
        product_options: {
          include: {
            variant_options: true,
          },
        },
        product_categories: true,
      },
    });

    const host = req.headers.host;
    const protocol = req.protocol;
    const getFullUrl = (path?: string | null) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      return `${protocol}://${host}${path.startsWith("/") ? path : "/" + path}`;
    };

    const products = foundproduct.map((prod) => {
      const productImages = prod.product_images.map((img) => ({
        id: img.id, // ✅ ใช้ชื่อที่ถูกต้อง
        image_url: getFullUrl(img.image_url),
        is_primary: img.is_primary,
        sort_order: img.sort_order,
      }));

      const shops = prod.product_owners.map((po) => ({
        shop_id: po.shops.shop_id,
        shop_name: po.shops.shop_name,
      }));

      const primaryImage = prod.product_images.find((img) => img.is_primary);
      const mainImage = primaryImage
        ? getFullUrl(primaryImage.image_url)
        : productImages.length > 0
        ? productImages[0].image_url
        : null;

      // ✅ คำนวณ total_stock สำหรับแต่ละ variant
      const variants = prod.product_variants.map((variant) => {
        // รวม quantity จากทุก batch ที่มี variant_id ตรงกัน
        const totalStock = variant.product_batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);

        return {
          variant_id: variant.variant_id,
          sku: variant.sku,
          price: variant.price ? Number(variant.price) : null,
          total_stock: totalStock, // ✅ เพิ่ม total_stock
          variant_options: variant.variant_options.map((vo) => ({
            variant_option_id: vo.variant_option_id,
            option_name: vo.option.name,
            value: vo.value,
            option_id: vo.option_id,
          })),
          batches: variant.product_batches?.map((batch) => ({
            batch_id: batch.batch_id,
            batch_number: batch.batch_number,
            manufactured_date: batch.manufactured_date?.toISOString() || null,
            expiry_date: batch.expiry_date?.toISOString() || null,
            quantity: batch.quantity,
          })) || [],
        };
      });

      const productOptions = prod.product_options.map((opt) => ({
        option_id: opt.option_id,
        name: opt.name,
        product_id: opt.product_id,
        variant_options: opt.variant_options.map((vo) => ({
          variant_option_id: vo.variant_option_id,
          value: vo.value,
          option_name: opt.name,
          option_id: opt.option_id,
        })),
      }));

      // ✅ คำนวณ total_stock สำหรับ product (ถ้าไม่มี variant)
      const productBatches = prod.product_batches
        .filter(batch => !batch.variant_id) // เฉพาะ batch ที่ไม่มี variant_id
        .map((batch) => ({
          batch_id: batch.batch_id,
          batch_number: batch.batch_number,
          manufactured_date: batch.manufactured_date?.toISOString() || null,
          expiry_date: batch.expiry_date?.toISOString() || null,
          quantity: batch.quantity,
        }));

      const productTotalStock = productBatches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);

      const variantPrices = prod.product_variants
        .map((v) => (v.price ? Number(v.price) : null))
        .filter((p): p is number => p !== null);
      const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;

      return {
        product_id: prod.product_id,
        product_name: prod.product_name,
        product_description: prod.product_description,
        price: prod.price ? Number(prod.price) : minVariantPrice,
        image: mainImage,
        status : prod.status,
        total_stock: productTotalStock, // ✅ stock รวมของ product
        product_images: productImages,
        product_variants: variants,
        product_options: productOptions,
        product_batches: productBatches,
        shop: shops,
        category_name: prod.product_categories?.category_name || null,
      };
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error loading products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default userproductRoute;