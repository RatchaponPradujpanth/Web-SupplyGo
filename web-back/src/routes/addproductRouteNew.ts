import { Router, Request, Response } from 'express';
import uploadProductImage from '../middleware/uploadProductImage';
import { authenticateToken, authstore } from '../middleware/authMiddleware';
import { ProductService } from '../services/productService';
import { ResponseHandler } from '../utils/responseHandler';
import { Validator } from '../middleware/validator';
import { ErrorHandler } from '../middleware/errorHandler';

const addproductRouteNew = Router();

// Validation rules for product creation
const productValidationRules = [
  { field: 'product_name', type: 'string' as const, required: true, min: 1 },
  { field: 'product_description', type: 'string' as const, required: false },
  { field: 'price', type: 'number' as const, required: true, min: 0 },
  { field: 'category_id', type: 'number' as const, required: true },
];

addproductRouteNew.post(
  '/addproduct',
  authenticateToken,
  authstore,
  uploadProductImage.array('images', 10),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.user_id;
      const shopId = req.user?.shop_id;

      // Check authentication
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'ไม่พบ user ID ใน token');
      }

      if (!shopId) {
        return ResponseHandler.forbidden(res, 'ไม่พบข้อมูลร้านค้า');
      }

      console.log('👤 User ID:', userId);
      console.log('🏪 Shop ID:', shopId);

      // Parse request data
      const {
        product_name,
        product_description,
        price,
        category_id,
        options,
        variants,
        batches,
      } = req.body;

      // Validate required fields
      if (!product_name || price === undefined || !category_id) {
        return ResponseHandler.badRequest(res, 'กรุณากรอกข้อมูลที่จำเป็น');
      }

      // Parse JSON fields
      let parsedOptions = [];
      let parsedVariants = [];
      let parsedBatches = [];

      try {
        parsedOptions = typeof options === 'string' ? JSON.parse(options) : options || [];
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants || [];
        parsedBatches = typeof batches === 'string' ? JSON.parse(batches) : batches || [];
      } catch (parseError) {
        return ResponseHandler.badRequest(res, 'ข้อมูล JSON ไม่ถูกต้อง');
      }

      // Get uploaded image paths
      const files = req.files as Express.Multer.File[];
      const imagePaths = files?.map((file) => `/uploads/products/${file.filename}`) || [];

      if (imagePaths.length === 0) {
        return ResponseHandler.badRequest(res, 'กรุณาอัปโหลดรูปภาพสินค้าอย่างน้อย 1 รูป');
      }

      console.log('📦 Creating product with ProductService...');

      // Create product using service
      const product = await ProductService.createProduct({
        shopId,
        productName: product_name,
        productDescription: product_description || '',
        price: Number(price),
        categoryId: Number(category_id),
        imagePaths,
        options: parsedOptions,
        variants: parsedVariants,
        batches: parsedBatches,
      });

      console.log('✅ Product created successfully:', product.product_id);

      return ResponseHandler.created(res, 'เพิ่มสินค้าสำเร็จ', {
        product_id: product.product_id,
        product_name: product.product_name,
      });
    } catch (error) {
      console.error('❌ Error creating product:', error);
      if (error instanceof Error) {
        return ResponseHandler.error(res, 'เกิดข้อผิดพลาดในการเพิ่มสินค้า', error.message);
      }
      return ResponseHandler.error(res, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
    }
  }
);

export default addproductRouteNew;
