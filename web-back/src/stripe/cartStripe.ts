// GET /api/cart-summary/:cartId
import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { authenticateToken } from '../middleware/authMiddleware';

const cartStripe = Router();

cartStripe.get(
  '/cart-summary/:cartId',
  authenticateToken,
  async (req: Request & { user?: { user_id: number } }, res: Response): Promise<void> => {
    const cartId = req.params.cartId;

    try {
      const result = await pool.query(
        `
        SELECT 
          ci.shop_id, 
          s.shop_name,
          s.stripe_account_id, 
          SUM(ci.quantity * ci.price_per_unit) AS amount,
          c.user_id
        FROM cart_items ci
        JOIN shops s ON ci.shop_id = s.shop_id
        JOIN cart c ON ci.cart_id = c.cart_id
        WHERE ci.cart_id = $1
        GROUP BY ci.shop_id, s.shop_name, s.stripe_account_id, c.user_id
        `,
        [cartId]
      );

      const shopPayments = result.rows;

      if (shopPayments.length === 0) {
        res.status(400).json({ message: 'ไม่พบสินค้าหรือร้านค้าในตะกร้า' });
        return;
      }

      res.status(200).json({
        message: 'ดึงข้อมูลตะกร้าสำเร็จ',
        data: shopPayments,
      });
    } catch (err) {
      console.error('❌ ดึงข้อมูล cart summary ล้มเหลว:', err);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
  }
);


export default cartStripe;
