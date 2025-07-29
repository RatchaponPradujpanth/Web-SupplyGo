import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PrismaClient} from "@prisma/client";


const cartRoute = Router();
const prisma = new PrismaClient();
cartRoute.get("/cart",authenticateToken, async(req : Request,res : Response):Promise<void> =>{
   
    try{
        //const user = req.user as {user_id:number};
        

        //const querycart = 'SELECT cart_id FROM cart WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1'
        const userId = req.user?.user_id
        const resultcart = await prisma.cart.findUnique({
          where : {
            user_id : userId
          },
          select : {
            cart_id : true
          }
        })

if (!resultcart) {
      res.status(404).json({ message: "cart not found" });
      return;
    }

   

    const resultitem = await prisma.cart_items.findMany({
      where : {
        cart_id : resultcart.cart_id
      },
      orderBy: { shops: { shop_name: 'asc' } },
      select : {
        cart_item_id : true,
        quantity : true,
        price_per_unit : true,
        
        products : {
          select: {
            product_name : true,
            image : true,
          }
        },
        shops : {
          select :{
            shop_name : true
          }
        }
        
      }
    })

//const resultitem = await pool.query(queryitem, [cartId]);
       const host = req.headers.host; // ex: "192.168.1.133:5000"
    const protocol = req.protocol; // ex: "http"

    const itemsWithImageUrl = resultitem.map(prod => ({
  cart_item_id: prod.cart_item_id,
  quantity: prod.quantity,
  price_per_unit: prod.price_per_unit,
  product_name: prod.products.product_name,
  image: prod.products.image ? `${protocol}://${host}${prod.products.image}` : null,
  shop_name: prod.shops.shop_name,
  total_price: (prod.quantity ?? 0) * Number(prod.price_per_unit ?? 0)
}));




res.status(200).json({
  cart_id: resultcart.cart_id,
  items: itemsWithImageUrl,
});

    }catch(error){
        console.error("❌ Error loading cart:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการโหลดข้อมูลตะกร้า" });
    }
})

export default cartRoute;