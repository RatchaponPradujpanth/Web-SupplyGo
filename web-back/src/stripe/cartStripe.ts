// GET /api/cart-summary/:cartId
import { Router, Request, Response } from 'express';
import { PrismaClient} from "@prisma/client";
import { authenticateToken } from '../middleware/authMiddleware';

const cartStripe = Router();
const prisma = new PrismaClient();
cartStripe.get(
  '/cart-summary/:cartId',
  authenticateToken,
  async (req: Request & { user?: { user_id: number } }, res: Response): Promise<void> => {
    const cartId = parseInt(req.params.cartId, 10);

    try {


      const result = await prisma.cart_items.findMany({
        where : {
          cart_id : cartId,
        },
        select : {
          quantity : true,
          price_per_unit : true,
          shops : {
            select : {
              shop_id :true,
              shop_name : true,
              stripe_account_id: true,
            }
          },
          cart : {
            select :{
              user_id : true,
            }
          }
        }

      })

      const shopPaymentsMap = result.reduce((acc, item) => {
  const shopId = item.shops.shop_id;
  const shopName = item.shops.shop_name ?? "Unknown Shop";  // กำหนดชื่อสำรอง
  const stripeAccountId = item.shops.stripe_account_id ?? null;

  if (!acc[shopId]) {
    acc[shopId] = {
      shop_id: shopId,
      shop_name: shopName,
      stripe_account_id: stripeAccountId,
      amount: 0,
      user_id: item.cart.user_id,
    };
  }

  acc[shopId].amount += Number(item.quantity) * Number(item.price_per_unit);

  return acc;
}, {} as Record<
  number,
  {
    shop_id: number;
    shop_name: string;
    stripe_account_id: string | null;
    amount: number;
    user_id: number;
  }
>);
    
const shopPayments = Object.values(shopPaymentsMap);

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
