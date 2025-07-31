import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient, products } from "@prisma/client";

const cartSummaryRoute = Router();
const prisma = new PrismaClient();


cartSummaryRoute.get("/cartsummary",authenticateToken,async (req : Request , res : Response):Promise<void> => {
    try {
    
    const userId = req.user?.user_id

    const resultcart = await prisma.cart.findFirst({
      where : {
        user_id : userId,
      },
      select :{
        cart_id : true,
      }
    })


      //เช็คตะกร้า
  if (!resultcart) {
  res.status(404).json({ message: "ไม่พบตะกร้าของผู้ใช้" });
  return;
}
    const resultitem = await prisma.cart_items.findMany({
      where : {
        cart_id : resultcart.cart_id
      },
      select : {
        cart_item_id: true,
        quantity : true,
        price_per_unit : true,

        products : {
          select : {
            product_name : true,
            image : true,
          }
        },

        shops :{
          select : {
            shop_id : true,
            shop_name : true,
          }
        }

        
      }
    });

    const itemsWithTotal = resultitem.map(item => ({
  cart_item_id: item.cart_item_id,
  quantity: item.quantity,
  price_per_unit: item.price_per_unit,
  total_price: Number(item.quantity) * Number(item.price_per_unit),
  product_name: item.products.product_name,
  image: item.products.image,
  shop_id: item.shops.shop_id,
  shop_name: item.shops.shop_name
}));
    const totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.total_price, 0);

res.status(200).json({ 
  cart_id: resultcart.cart_id, // หรือ resultcart.cart_id
  items: itemsWithTotal,
  totalAmount 
});
    } catch (error) {
        console.error('❌ Error loading cart summary:');
        res.status(500).json({ message: 'Internal server error' });
    }
})
export default cartSummaryRoute;