import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { pool } from '../config/db';

const cartSummaryRoute = Router();

cartSummaryRoute.get("/cartsummary",authenticateToken,async (req : Request , res : Response):Promise<void> => {
    try {
        const user = req.user as {user_id:number}
    const userId = user.user_id

    const querycart = 'SELECT cart_id FROM cart WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1';
    const resultcart = await pool.query(querycart,[userId])

    if (resultcart.rows.length === 0){
        res.status(200).json({item :[] , totalamount:[]})
        return;
    }

    const cartId = resultcart.rows[0].cart_id;

    const queryitem = `
      SELECT 
        ci.cart_item_id,
        ci.quantity,
        ci.price_per_unit,
        (ci.quantity * ci.price_per_unit) AS total_price,
        p.product_name,
        s.shop_id,
        s.shop_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      JOIN shops s ON ci.shop_id = s.shop_id
      WHERE ci.cart_id = $1
    `;
    const resultitem = await pool.query(queryitem,[cartId])
    const items = resultitem.rows

    const totalAmount = items.reduce((sum, item) => sum + Number(item.total_price), 0);
    res.status(200).json({ cart_id: cartId, items, totalAmount });

    } catch (error) {
        console.error('❌ Error loading cart summary:');
        res.status(500).json({ message: 'Internal server error' });
    }
})
export default cartSummaryRoute;