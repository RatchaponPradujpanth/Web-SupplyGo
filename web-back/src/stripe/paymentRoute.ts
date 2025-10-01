import { Router, Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/authMiddleware';

// Types for the payment route
interface VariantOptionForPayment {
  value: string;
  option: {
    name: string;
  };
  variant: {
    sku: string;
  };
}

interface OrderItemForPayment {
  order_item_id: number;
  product_id: number;
  quantity: number | null;
  price_per_unit: number | null;
  total_price: number | null;
  products: {
    product_id: number;
    product_name: string;
  } | null;
  variant_option: VariantOptionForPayment | null;
}

interface OrderShopForPayment {
  order_shop_id: number;
  shop_id: number;
  subtotal: number | null;
  status: string | null;
  shops: {
    shop_id: number;
    shop_name: string;
    stripe_account_id: string;
  } | null;
  order_items: OrderItemForPayment[];
}

interface OrderForPayment {
  order_id: number;
  order_date: Date | null;
  total_amount: number | null;
  users: {
    user_id: number;
    username: string;
    email: string;
  };
  order_shops: OrderShopForPayment[];
}

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,);
const prisma = new PrismaClient();

const paymentRoute = Router();

paymentRoute.post('/payment-multivendor', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { orderId } = req.body; // ถ้า frontend ส่ง orderId มา จะใช้ตัวนั้น

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // หา order ที่ status = 'not paid'
    let order: OrderForPayment | null = null;
    if (orderId) {
      // หา order โดยตรงจาก orderId และต้อง status เป็น 'not paid'
      order = await prisma.order.findFirst({
        where: { 
          order_id: Number(orderId), 
          user_id: userId, 
          status: 'not paid' 
        },
        include: {
          order_shops: {
            where: {
              status: 'not paid' // เพิ่มเงื่อนไขให้ดึงเฉพาะ order_shops ที่ยังไม่ชำระ
            },
            include: {
              shops: {
                select: {
                  shop_id: true,
                  shop_name: true,
                  stripe_account_id: true
                }
              },
              order_items: {
                include: {
                  products: {
                    select: {
                      product_id: true,
                      product_name: true
                    }
                  },
                  variant_option: {
                    include: {
                      option: {
                        select: {
                          name: true
                        }
                      },
                      variant: {
                        select: {
                          sku: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          users: {
            select: {
              user_id: true,
              username: true,
              email: true
            }
          }
        }
      }) as OrderForPayment | null;
    } else {
      // หา order ล่าสุดของ user ที่ status = 'not paid'
      order = await prisma.order.findFirst({
        where: { 
          user_id: userId, 
          status: 'not paid' 
        },
        include: {
          order_shops: {
            where: {
              status: 'not paid' // เพิ่มเงื่อนไขให้ดึงเฉพาะ order_shops ที่ยังไม่ชำระ
            },
            include: {
              shops: {
                select: {
                  shop_id: true,
                  shop_name: true,
                  stripe_account_id: true
                }
              },
              order_items: {
                include: {
                  products: {
                    select: {
                      product_id: true,
                      product_name: true
                    }
                  },
                  variant_option: {
                    include: {
                      option: {
                        select: {
                          name: true
                        }
                      },
                      variant: {
                        select: {
                          sku: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          users: {
            select: {
              user_id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { order_date: 'desc' }
      }) as OrderForPayment | null;
    }

    // *** เพิ่ม console.log เพื่อตรวจสอบข้อมูล order ***
    console.log('🔍 order fetched:', JSON.stringify(order, null, 2));

    if (!order) {
       res.status(404).json({ message: 'ไม่พบคำสั่งซื้อที่มีสถานะ not paid' });
       return;
    }

    // ตรวจสอบว่ามี order_shops ที่ยังไม่ชำระหรือไม่
    if (!order.order_shops || order.order_shops.length === 0) {
      res.status(404).json({ message: 'ไม่พบรายการสินค้าในคำสั่งซื้อที่ยังไม่ชำระเงิน' });
      return;
    }

    const paymentIntents: Array<any> = [];

    // สร้าง PaymentIntent สำหรับแต่ละ order_shop ที่ status = 'not paid'
    for (const shopOrder of order.order_shops) {
      const shopId = shopOrder.shop_id;
      const shopName = shopOrder.shops?.shop_name ?? `shop_${shopId}`;
      const stripeAccountId = shopOrder.shops?.stripe_account_id;

      // ตรวจสอบว่า order_shop นี้ยังไม่ได้ชำระเงินจริง ๆ
      if (shopOrder.status !== 'not paid') {
        console.log(`⏭️ ข้าม order_shop_id ${shopOrder.order_shop_id} เพราะสถานะเป็น: ${shopOrder.status}`);
        continue;
      }

      // ถ้าร้านยังไม่ได้เชื่อม stripe -> บอก frontend
      if (!stripeAccountId) {
         res.status(400).json({
          message: `ร้าน ${shopName} ยังไม่ได้เชื่อม Stripe กรุณาติดต่อร้านค้า`
        });
        return;
      }

      // subtotal มักจะเป็น Decimal type จาก Prisma — แปลงเป็น number ก่อนคำนวณสตางค์
      const subtotal = parseFloat(String(shopOrder.subtotal ?? 0));
      if (isNaN(subtotal) || subtotal <= 0) {
        res.status(400).json({
          message: `ยอดของร้าน ${shopName} ไม่ถูกต้อง: ${shopOrder.subtotal}`
        });
        return;
      }

      const amountInSatang = Math.round(subtotal * 100); // THB -> สตางค์

      // สร้าง PaymentIntent (Direct charge) ไปยัง account ของร้าน
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSatang,
        currency: 'thb',
        description: `ชำระเงินให้ร้าน ${shopName} (order ${order.order_id})`,
        automatic_payment_methods: { enabled: true },
        transfer_data: { destination: stripeAccountId },
        metadata: {
          order_id: String(order.order_id),
          order_shop_id: String(shopOrder.order_shop_id),
          user_id: String(userId),
          shop_id: String(shopId),
          shop_name: shopName
        }
      });

      // บันทึก paymentIntent.id ไว้ในตาราง order_shops (transaction_id) เพื่อจับคู่บน webhook
      await prisma.order_shops.update({
        where: { order_shop_id: shopOrder.order_shop_id },
        data: {
          transaction_id: paymentIntent.id
        }
      });

      paymentIntents.push({
        order_shop_id: shopOrder.order_shop_id,
        shop_id: shopId,
        shop_name: shopName,
        amount: subtotal,
        amount_in_satang: amountInSatang,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        stripe_account: stripeAccountId,
        order_items: shopOrder.order_items.map((item: OrderItemForPayment) => ({
          product_id: item.product_id,
          product_name: item.products?.product_name,
          variant_option: item.variant_option ? {
            value: item.variant_option.value,
            option_name: item.variant_option.option.name,
            sku: item.variant_option.variant.sku
          } : null,
          quantity: item.quantity,
          price_per_unit: item.price_per_unit,
          total_price: item.total_price
        }))
      });
    }

    // ตรวจสอบว่ามี PaymentIntent ที่สร้างสำเร็จหรือไม่
    if (paymentIntents.length === 0) {
      res.status(400).json({ 
        message: 'ไม่สามารถสร้าง PaymentIntent ได้ อาจเนื่องจากทุกรายการชำระเงินแล้วหรือร้านยังไม่เชื่อม Stripe' 
      });
      return;
    }

    res.status(200).json({
      message: 'สร้าง PaymentIntents สำหรับแต่ละร้านสำเร็จ',
      order_id: order.order_id,
      order_date: order.order_date,
      total_amount: order.total_amount,
      user_info: order.users,
      total_payment_intents: paymentIntents.length,
      paymentIntents
    });
    return;

  } catch (error) {
    console.error('❌ สร้าง PaymentIntent ล้มเหลว:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการชำระเงิน', 
      error: String(error) 
    });
    return;
  }
});

export default paymentRoute;