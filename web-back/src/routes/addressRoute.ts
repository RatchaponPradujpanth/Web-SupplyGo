import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { authenticateToken } from "../middleware/authMiddleware";

const addressRoute = Router();

// POST /api/address
addressRoute.post('/add-address', authenticateToken, async (req: Request & { user?: { user_id: number } }, res: Response) => {
  const { address } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO address (
          user_id, firstname, lastname, phone_number, house_number, street, 
          sub_district, district, province, postal_code, address_type
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING address_id`,
      [
        req.user!.user_id,
        address.firstname,
        address.lastname,
        address.phone_number,
        address.house_number,
        address.street,
        address.sub_district,
        address.district,
        address.province,
        address.postal_code,
        address.address_type,
      ]
    );

    res.status(200).json({
      message: 'เพิ่มที่อยู่สำเร็จ',
      address_id: result.rows[0].address_id,
    });
  } catch (error) {
    console.error('❌ เพิ่มที่อยู่ล้มเหลว:', error);
    res.status(500).json({ message: 'ไม่สามารถเพิ่มที่อยู่ได้' });
  }
});

export default addressRoute;