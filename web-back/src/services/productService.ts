import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VariantData {
  sku: string;
  price: number;
  stock_quantity: number;
  option_values: string[];
}

interface OptionData {
  name: string;
  values: string[];
}

interface BatchData {
  batch_number: string;
  manufactured_date: string;
  expiry_date: string;
  quantity: string;
}

export class ProductService {
  static async createProduct(data: {
    shopId: number;
    productName: string;
    productDescription: string;
    price: number;
    categoryId: number;
    imagePaths: string[];
    options?: OptionData[];
    variants?: VariantData[];
    batches?: BatchData[][];
  }) {
    const {
      shopId,
      productName,
      productDescription,
      price,
      categoryId,
      imagePaths,
      options = [],
      variants = [],
      batches = [],
    } = data;

    console.log('📦 Creating product:', productName);

    const product = await prisma.products.create({
      data: {
        product_name: productName,
        product_description: productDescription,
        price: variants.length > 0 ? 0 : price,
        category_id: categoryId,
      },
    });

    console.log('✅ Product created:', product.product_id);

    await prisma.product_owners.create({
      data: {
        shop_id: shopId,
        product_id: product.product_id,
      },
    });

    if (imagePaths.length > 0) {
      await this.createProductImages(product.product_id, imagePaths);
    }

    if (variants.length > 0 && options.length > 0) {
      await this.createOptionsAndVariants(
        product.product_id,
        options,
        variants,
        batches
      );
    } else if (batches.length > 0 && batches[0].length > 0) {
      await this.createSimpleBatches(product.product_id, batches[0]);
    }

    return product;
  }

  private static async createProductImages(productId: number, imagePaths: string[]) {
    await prisma.product_images.createMany({
      data: imagePaths.map((path, index) => ({
        product_id: productId,
        image_url: path,
        is_primary: index === 0,
      })),
    });
    console.log(`✅ Created ${imagePaths.length} product images`);
  }

  private static async createOptionsAndVariants(
    productId: number,
    options: OptionData[],
    variants: VariantData[],
    batches: BatchData[][]
  ) {
    const optionRecords = await Promise.all(
      options.map((opt) =>
        prisma.product_options.create({
          data: {
            product_id: productId,
            name: opt.name,
          },
        })
      )
    );

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      
      const createdVariant = await prisma.product_variants.create({
        data: {
          product_id: productId,
          sku: variant.sku || `SKU-${productId}-${i + 1}`,
          price: variant.price,
        },
      });

      for (let j = 0; j < variant.option_values.length && j < optionRecords.length; j++) {
        await prisma.variant_options.create({
          data: {
            variant_id: createdVariant.variant_id,
            option_id: optionRecords[j].option_id,
            value: variant.option_values[j],
          },
        });
      }

      if (batches[i] && batches[i].length > 0) {
        await this.createVariantBatches(createdVariant.variant_id, batches[i], productId);
      }
    }
  }

  private static async createVariantBatches(
    variantId: number,
    batchData: BatchData[],
    productId: number
  ) {
    const validBatches = batchData.filter((b) => b.batch_number && b.quantity);
    if (validBatches.length > 0) {
      await prisma.product_batches.createMany({
        data: validBatches.map((b) => ({
          product_id: productId,
          variant_id: variantId,
          batch_number: b.batch_number,
          manufactured_date: b.manufactured_date ? new Date(b.manufactured_date) : null,
          expiry_date: b.expiry_date ? new Date(b.expiry_date) : null,
          quantity: parseInt(b.quantity),
        })),
      });
    }
  }

  private static async createSimpleBatches(productId: number, batchData: BatchData[]) {
    const validBatches = batchData.filter((b) => b.batch_number && b.quantity);
    if (validBatches.length > 0) {
      await prisma.product_batches.createMany({
        data: validBatches.map((b) => ({
          product_id: productId,
          batch_number: b.batch_number,
          manufactured_date: b.manufactured_date ? new Date(b.manufactured_date) : null,
          expiry_date: b.expiry_date ? new Date(b.expiry_date) : null,
          quantity: parseInt(b.quantity),
        })),
      });
    }
  }

  static async getProductsByShop(shopId: number) {
    return await prisma.products.findMany({
      where: {
        product_owners: {
          some: { shop_id: shopId },
        },
      },
      include: {
        product_categories: true,
        product_images: true,
        product_variants: {
          include: {
            variant_options: true,
            product_batches: true,
          },
        },
        product_options: true,
        product_owners: {
          include: {
            shops: true,
          },
        },
      },
    });
  }

  static async getProductById(productId: number) {
    return await prisma.products.findUnique({
      where: { product_id: productId },
      include: {
        product_categories: true,
        product_images: true,
        product_variants: {
          include: {
            variant_options: true,
            product_batches: true,
          },
        },
        product_options: true,
        product_owners: {
          include: {
            shops: true,
          },
        },
      },
    });
  }

  static async updateProduct(
    productId: number,
    data: {
      productName?: string;
      productDescription?: string;
      price?: number;
      categoryId?: number;
    }
  ) {
    const updateData: any = {};
    if (data.productName) updateData.product_name = data.productName;
    if (data.productDescription) updateData.product_description = data.productDescription;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.categoryId) updateData.category_id = data.categoryId;

    return await prisma.products.update({
      where: { product_id: productId },
      data: updateData,
    });
  }

  static async deleteProduct(productId: number) {
    await prisma.product_batches.deleteMany({ where: { product_id: productId } });
    
    // Delete variant_options for all variants of this product
    const variants = await prisma.product_variants.findMany({
      where: { product_id: productId },
      select: { variant_id: true },
    });
    
    for (const variant of variants) {
      await prisma.variant_options.deleteMany({
        where: { variant_id: variant.variant_id },
      });
    }
    
    await prisma.product_variants.deleteMany({ where: { product_id: productId } });
    await prisma.product_options.deleteMany({ where: { product_id: productId } });
    await prisma.product_images.deleteMany({ where: { product_id: productId } });
    await prisma.product_owners.deleteMany({ where: { product_id: productId } });

    return await prisma.products.delete({ where: { product_id: productId } });
  }

  static async getPublicProducts() {
    return await prisma.products.findMany({
      include: {
        product_categories: true,
        product_images: true,
        product_variants: {
          include: {
            variant_options: true,
            product_batches: true,
          },
        },
        product_options: true,
        product_owners: {
          include: {
            shops: true,
          },
        },
      },
    });
  }
}
