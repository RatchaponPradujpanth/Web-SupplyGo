import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { ProductService } from '../services/productService';
import { ResponseHandler } from '../utils/responseHandler';

const userproductRouteNew = Router();

// Get products for authenticated user (shop products)
userproductRouteNew.get('/userproduct', authenticateToken, async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shop_id;

    if (!shopId) {
      return ResponseHandler.forbidden(res, 'ไม่พบข้อมูลร้านค้า');
    }

    console.log('🏪 Loading products for shop:', shopId);

    const products = await ProductService.getProductsByShop(shopId);

    return ResponseHandler.success(res, 'โหลดสินค้าสำเร็จ', products);
  } catch (error) {
    console.error('❌ Error loading user products:', error);
    if (error instanceof Error) {
      return ResponseHandler.error(res, 'เกิดข้อผิดพลาดในการโหลดสินค้า', error.message);
    }
    return ResponseHandler.error(res, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
  }
});

// Get public products (for customers)
userproductRouteNew.get('/publicproducts', async (req: Request, res: Response) => {
  try {
    console.log('🛍️ Loading public products...');

    const products = await ProductService.getPublicProducts();

    return ResponseHandler.success(res, 'โหลดสินค้าสำเร็จ', products);
  } catch (error) {
    console.error('❌ Error loading public products:', error);
    if (error instanceof Error) {
      return ResponseHandler.error(res, 'เกิดข้อผิดพลาดในการโหลดสินค้า', error.message);
    }
    return ResponseHandler.error(res, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
  }
});

// Get single product by ID
userproductRouteNew.get('/product/:id', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return ResponseHandler.badRequest(res, 'Product ID ไม่ถูกต้อง');
    }

    console.log('🔍 Loading product:', productId);

    const product = await ProductService.getProductById(productId);

    if (!product) {
      return ResponseHandler.notFound(res, 'ไม่พบสินค้า');
    }

    return ResponseHandler.success(res, 'โหลดสินค้าสำเร็จ', product);
  } catch (error) {
    console.error('❌ Error loading product:', error);
    if (error instanceof Error) {
      return ResponseHandler.error(res, 'เกิดข้อผิดพลาดในการโหลดสินค้า', error.message);
    }
    return ResponseHandler.error(res, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
  }
});

// Update product
userproductRouteNew.put('/product/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const shopId = req.user?.shop_id;

    if (!shopId) {
      return ResponseHandler.forbidden(res, 'ไม่พบข้อมูลร้านค้า');
    }

    if (isNaN(productId)) {
      return ResponseHandler.badRequest(res, 'Product ID ไม่ถูกต้อง');
    }

    // Verify product belongs to shop
    const product = await ProductService.getProductById(productId);
    if (!product) {
      return ResponseHandler.notFound(res, 'ไม่พบสินค้า');
    }

    const ownsProduct = product.product_owners.some((owner) => owner.shop_id === shopId);
    if (!ownsProduct) {
      return ResponseHandler.forbidden(res, 'คุณไม่มีสิทธิ์แก้ไขสินค้านี้');
    }

    console.log('📝 Updating product:', productId);

    const updatedProduct = await ProductService.updateProduct(productId, {
      productName: req.body.product_name,
      productDescription: req.body.product_description,
      price: req.body.price ? Number(req.body.price) : undefined,
      categoryId: req.body.category_id ? Number(req.body.category_id) : undefined,
    });

    return ResponseHandler.success(res, 'อัปเดตสินค้าสำเร็จ', updatedProduct);
  } catch (error) {
    console.error('❌ Error updating product:', error);
    if (error instanceof Error) {
      return ResponseHandler.error(res, 'เกิดข้อผิดพลาดในการอัปเดตสินค้า', error.message);
    }
    return ResponseHandler.error(res, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
  }
});

// Delete product
userproductRouteNew.delete('/product/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const shopId = req.user?.shop_id;

    if (!shopId) {
      return ResponseHandler.forbidden(res, 'ไม่พบข้อมูลร้านค้า');
    }

    if (isNaN(productId)) {
      return ResponseHandler.badRequest(res, 'Product ID ไม่ถูกต้อง');
    }

    // Verify product belongs to shop
    const product = await ProductService.getProductById(productId);
    if (!product) {
      return ResponseHandler.notFound(res, 'ไม่พบสินค้า');
    }

    const ownsProduct = product.product_owners.some((owner) => owner.shop_id === shopId);
    if (!ownsProduct) {
      return ResponseHandler.forbidden(res, 'คุณไม่มีสิทธิ์ลบสินค้านี้');
    }

    console.log('🗑️ Deleting product:', productId);

    await ProductService.deleteProduct(productId);

    return ResponseHandler.success(res, 'ลบสินค้าสำเร็จ');
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    if (error instanceof Error) {
      return ResponseHandler.error(res, 'เกิดข้อผิดพลาดในการลบสินค้า', error.message);
    }
    return ResponseHandler.error(res, 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
  }
});

export default userproductRouteNew;
