-- ตรวจสอบสต็อกของสินค้า product_id = 37

-- 1. ดู product variants
SELECT 
    pv.variant_id,
    pv.product_id,
    pv.sku,
    pv.price
FROM product_variants pv
WHERE pv.product_id = 37;

-- 2. ดู product batches (ทั้งที่เชื่อมกับ product และ variant)
SELECT 
    pb.batch_id,
    pb.product_id,
    pb.variant_id,
    pb.batch_number,
    pb.quantity,
    pb.manufactured_date,
    pb.expiry_date
FROM product_batches pb
WHERE pb.product_id = 37 OR pb.variant_id IN (
    SELECT variant_id FROM product_variants WHERE product_id = 37
);

-- 3. ดูสต็อกรวมของสินค้า
SELECT 
    p.product_id,
    p.product_name,
    p.price,
    p.status,
    -- Stock จาก product batches
    COALESCE(SUM(pb_product.quantity), 0) as product_batches_stock,
    -- Stock จาก variant batches
    (
        SELECT COALESCE(SUM(pb_variant.quantity), 0)
        FROM product_variants pv
        LEFT JOIN product_batches pb_variant ON pv.variant_id = pb_variant.variant_id
        WHERE pv.product_id = p.product_id
    ) as variant_batches_stock,
    -- Total stock
    COALESCE(SUM(pb_product.quantity), 0) + (
        SELECT COALESCE(SUM(pb_variant.quantity), 0)
        FROM product_variants pv
        LEFT JOIN product_batches pb_variant ON pv.variant_id = pb_variant.variant_id
        WHERE pv.product_id = p.product_id
    ) as total_stock
FROM products p
LEFT JOIN product_batches pb_product ON p.product_id = pb_product.product_id AND pb_product.variant_id IS NULL
WHERE p.product_id = 37
GROUP BY p.product_id, p.product_name, p.price, p.status;
