import { pool } from '../config/db';

export async function getCartDetails(cartId: number) {
  const query = `
    SELECT
      ci.shop_id,
      s.name AS shop_name,
      s.stripe_account_id,
      ci.product_id,
      ci.quantity,
      ci.price_per_unit
    FROM cart_items ci
    JOIN cart c ON ci.cart_id = c.cart_id
    JOIN shops s ON ci.shop_id = s.shop_id
    WHERE c.cart_id = $1
    ORDER BY ci.shop_id;
  `;

  const { rows } = await pool.query(query, [cartId]);

  const shopsMap: Record<string, any> = {};

  for (const row of rows) {
    if (!shopsMap[row.shop_id]) {
      shopsMap[row.shop_id] = {
        id: row.shop_id,
        name: row.shop_name,
        stripeAccountId: row.stripe_account_id,  // ต้องมีคอลัมน์นี้ใน shops table
        totalAmount: 0,
        items: [],
      };
    }
    const totalPrice = Number(row.price_per_unit) * row.quantity;
    shopsMap[row.shop_id].items.push({
      productId: row.product_id,
      quantity: row.quantity,
      price: Number(row.price_per_unit),
      totalPrice,
    });
    shopsMap[row.shop_id].totalAmount += totalPrice;
  }

  return { shops: Object.values(shopsMap) };
}
