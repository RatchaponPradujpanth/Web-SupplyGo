import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { authenticateToken } from '../middleware/authMiddleware';

const cartRoute = Router();

cartRoute.get("/cart",authenticateToken, async(req : Request,res : Response):Promise<void> =>{
   
    try{
        const protocol = req.protocol;  // 'http' หรือ 'https'
const host = req.get('host');   // 'localhost:5000' หรือโดเมน

        const user = req.user as {user_id:number};
        const userId = user.user_id

        const querycart = 'SELECT cart_id FROM cart WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1'
        const resultcart = await pool.query (querycart , [userId])

        if (resultcart.rows.length === 0 ){
            res.status(200).json({items: [], cart_id: null})
            return;
        }

        const cartId = resultcart.rows[0].cart_id;

        
// ดึงข้อมูลจาก DB เช่น:
const queryitem = `
  SELECT 
    ci.cart_item_id,
    ci.quantity,
    ci.price_per_unit,
    (ci.quantity * ci.price_per_unit) AS total_price,
    p.product_name,
    p.image,
    s.shop_name
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.product_id
  JOIN shops s ON ci.shop_id = s.shop_id
  WHERE ci.cart_id = $1
  ORDER BY s.shop_name ASC
`;

const resultitem = await pool.query(queryitem, [cartId]);

const itemsWithImageUrl = resultitem.rows.map((item) => ({
  ...item,
  image: item.image
    ? `${protocol}://${host}/images/${item.image.replace(/^.*[\\\/]/, '').replace(/"/g, '')}`
    : null,
}));
console.log(itemsWithImageUrl);
res.status(200).json({
  cart_id: cartId,
  items: itemsWithImageUrl,
});

    }catch(error){
        console.error("❌ Error loading cart:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการโหลดข้อมูลตะกร้า" });
    }
})

export default cartRoute;