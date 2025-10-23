# 📦 คู่มือระบบ Batch สำหรับจัดการสต็อกสินค้า

## 🎯 Batch คืออะไร?

**Batch** (ล็อตสินค้า) คือ ชุดของสินค้าที่ผลิตในช่วงเวลาเดียวกัน มีวันผลิตและวันหมดอายุเหมือนกัน

ระบบ SupplyGo ใช้ Batch เพื่อ:
- ✅ เก็บ **จำนวนสต็อกสินค้า** (Quantity)
- ✅ ติดตาม **วันผลิต** และ **วันหมดอายุ**
- ✅ จัดการสินค้าแบบ FIFO (First In First Out)
- ✅ ตรวจสอบสินค้าใกล้หมดอายุ

---

## 📋 ฟิลด์ใน Batch

### 1. **Batch Number** (หมายเลขล็อต) 🏷️
- **คืออะไร**: รหัสประจำชุดการผลิต
- **ตัวอย่าง**: 
  - `LOT-2024-001`
  - `BATCH-12345`
  - `2024-JAN-001`
- **ใช้ทำอะไร**: ติดตามและระบุล็อตสินค้า
- **บังคับหรือไม่**: ไม่บังคับ (ถ้าไม่กรอกจะสร้างอัตโนมัติ)

### 2. **Manufactured Date** (วันที่ผลิต) 📅
- **คืออะไร**: วันที่สินค้าถูกผลิต
- **รูปแบบ**: YYYY-MM-DD (เช่น 2024-01-15)
- **ตัวอย่าง**: `2024-01-15` = 15 มกราคม 2024
- **ใช้ทำอะไร**: 
  - ติดตามอายุสินค้า
  - จัดเรียงสินค้าตามวันผลิต
- **บังคับหรือไม่**: ไม่บังคับ (แนะนำให้กรอกสำหรับสินค้าที่มีอายุ)

### 3. **Expiry Date** (วันหมดอายุ) ⏰
- **คืออะไร**: วันที่สินค้าหมดอายุ
- **รูปแบบ**: YYYY-MM-DD (เช่น 2025-01-15)
- **ตัวอย่าง**: `2025-01-15` = 15 มกราคม 2025
- **ใช้ทำอะไร**: 
  - เตือนสินค้าใกล้หมดอายุ
  - ป้องกันขายสินค้าหมดอายุ
- **บังคับหรือไม่**: ไม่บังคับ (แนะนำให้กรอกสำหรับสินค้าที่มีอายุ)

### 4. **Quantity** (จำนวนสินค้า) 🔢 ⭐ **สำคัญที่สุด!**
- **คืออะไร**: **จำนวนสต็อกสินค้าที่มีในล็อตนี้**
- **ตัวอย่าง**: 
  - `100` = มีสินค้า 100 ชิ้นในล็อตนี้
  - `1000` = มีสินค้า 1000 ชิ้น
- **ใช้ทำอะไร**: 
  - **เก็บจำนวนสต็อกสินค้า**
  - ตรวจสอบว่ามีสินค้าพอขายหรือไม่
  - ลดจำนวนเมื่อมีการขาย
- **บังคับหรือไม่**: **✅ บังคับ!** ถ้าไม่กรอกสินค้าจะมี 0 ชิ้น

---

## 🚨 ปัญหาที่พบบ่อย

### ❌ ปัญหา: สินค้ามี 0 ชิ้นหลังเพิ่ม

**สาเหตุ**:
- ไม่ได้กรอก **Quantity** ในฟิลด์ Batch
- กรอก Quantity เป็น `0` หรือค่าที่ไม่ถูกต้อง

**วิธีแก้**:
```
✅ กรอกจำนวนสินค้าในฟิลด์ "Quantity"
❌ ห้ามเว้นว่าง หรือใส่ 0
```

**ตัวอย่างที่ถูกต้อง**:
```json
{
  "batch_number": "LOT-001",
  "manufactured_date": "2024-01-15",
  "expiry_date": "2025-01-15",
  "quantity": "100"  // ✅ ต้องกรอกตัวเลข > 0
}
```

**ตัวอย่างที่ผิด**:
```json
{
  "batch_number": "LOT-001",
  "manufactured_date": "2024-01-15",
  "expiry_date": "2025-01-15",
  "quantity": ""  // ❌ ว่างเปล่า = 0 ชิ้น
}
```

---

## 📝 ตัวอย่างการใช้งาน

### ตัวอย่าง 1: สินค้าที่มีอายุ (เช่น อาหาร ยา)

```json
{
  "batch_number": "FOOD-2024-001",
  "manufactured_date": "2024-01-15",
  "expiry_date": "2024-12-31",
  "quantity": "500"
}
```

**คำอธิบาย**:
- มีสินค้า 500 ชิ้น
- ผลิตวันที่ 15 ม.ค. 2024
- หมดอายุวันที่ 31 ธ.ค. 2024

### ตัวอย่าง 2: สินค้าที่ไม่มีอายุ (เช่น เสื้อผ้า กระเป๋า)

```json
{
  "batch_number": "BAG-2024-001",
  "manufactured_date": "",
  "expiry_date": "",
  "quantity": "1000"
}
```

**คำอธิบาย**:
- มีสินค้า 1000 ชิ้น
- ไม่ระบุวันผลิต/หมดอายุ (ไม่สำคัญสำหรับกระเป๋า)

### ตัวอย่าง 3: หลาย Batch (สินค้ามาหลายล็อต)

```json
[
  {
    "batch_number": "LOT-001",
    "manufactured_date": "2024-01-01",
    "expiry_date": "2024-12-31",
    "quantity": "100"
  },
  {
    "batch_number": "LOT-002",
    "manufactured_date": "2024-02-01",
    "expiry_date": "2025-01-31",
    "quantity": "200"
  }
]
```

**คำอธิบาย**:
- มี 2 ล็อต รวม 300 ชิ้น (100 + 200)
- ล็อต 001: 100 ชิ้น หมดอายุปลายปี 2024
- ล็อต 002: 200 ชิ้น หมดอายุต้นปี 2025

---

## 🔄 การทำงานของระบบ

### สำหรับสินค้าธรรมดา (ไม่มี Variants)

1. ✅ สร้าง **Default Variant** อัตโนมัติ
2. ✅ บันทึก Batch พร้อมจำนวนสินค้า
3. ✅ คำนวณสต็อกรวมจาก Batch ทั้งหมด

```
Product: กระเป๋า
├─ Default Variant (SKU: DEFAULT-35)
   └─ Batch LOT-001
      └─ Quantity: 1000 ชิ้น
```

### สำหรับสินค้าที่มี Variants (สี, ไซส์ ฯลฯ)

1. ✅ สร้าง Variant ตามตัวเลือก
2. ✅ บันทึก Batch แยกตาม Variant
3. ✅ แต่ละ Variant มี Stock แยกกัน

```
Product: เสื้อ
├─ Variant: สีแดง ไซส์ M
│  └─ Batch: LOT-001
│     └─ Quantity: 50 ตัว
│
├─ Variant: สีแดง ไซส์ L
│  └─ Batch: LOT-001
│     └─ Quantity: 30 ตัว
│
└─ Variant: สีน้ำเงิน ไซส์ M
   └─ Batch: LOT-001
      └─ Quantity: 40 ตัว
```

---

## 📊 ตรวจสอบสต็อกสินค้า

### ใน Database

```sql
-- ดูสต็อกของสินค้า ID = 35
SELECT 
  p.product_name,
  pb.batch_number,
  pb.quantity,
  pb.manufactured_date,
  pb.expiry_date
FROM product_batches pb
JOIN products p ON pb.product_id = p.product_id
WHERE p.product_id = 35;
```

### ใน Backend Log

เมื่อเพิ่มสินค้า จะเห็น log:
```
📦 Processing batches...
🔄 No variants, creating default variant...
✅ Default variant created: 123
✅ Batch created: LOT-001 with quantity: 1000
📊 Total stock quantity: 1000
```

ถ้าไม่กรอก quantity:
```
⚠️ Skipping batch with invalid quantity: 
📊 Total stock quantity: 0
⚠️ WARNING: Product has 0 stock! Please add quantity in batches.
```

---

## ✅ Checklist สำหรับเพิ่มสินค้า

### สินค้าไม่มี Variants
- [ ] กรอกชื่อสินค้า
- [ ] กรอกรายละเอียด
- [ ] กรอกราคา
- [ ] เลือกหมวดหมู่
- [ ] อัพโหลดรูปภาพ
- [ ] **กรอก Quantity ใน Batch** ⭐ **สำคัญที่สุด!**
- [ ] (ถ้าสินค้ามีอายุ) กรอกวันผลิต/หมดอายุ

### สินค้ามี Variants
- [ ] กรอกข้อมูลพื้นฐาน
- [ ] เพิ่ม Options (เช่น สี, ไซส์)
- [ ] สร้าง Variants
- [ ] **กรอก Quantity แต่ละ Variant** ⭐
- [ ] กรอก SKU แต่ละ Variant
- [ ] กรอกราคาแต่ละ Variant (ถ้าราคาต่างกัน)

---

## 🐛 Debugging

### ตรวจสอบว่าสินค้ามีสต็อกหรือไม่

```sql
-- ดูสต็อกรวมของสินค้า
SELECT 
  p.product_id,
  p.product_name,
  SUM(pb.quantity) as total_stock
FROM products p
LEFT JOIN product_batches pb ON p.product_id = pb.product_id
GROUP BY p.product_id, p.product_name
ORDER BY p.product_id DESC
LIMIT 10;
```

### ตรวจสอบ Variants

```sql
-- ดู variants ของสินค้า
SELECT 
  pv.variant_id,
  pv.sku,
  pv.price,
  SUM(pb.quantity) as stock
FROM product_variants pv
LEFT JOIN product_batches pb ON pv.variant_id = pb.variant_id
WHERE pv.product_id = 35
GROUP BY pv.variant_id, pv.sku, pv.price;
```

---

## 💡 Tips

1. **สินค้าที่ไม่มีอายุ**: ไม่จำเป็นต้องกรอกวันผลิต/หมดอายุ แค่กรอก Quantity
2. **Batch Number**: ถ้าไม่กรอก ระบบจะสร้างให้อัตโนมัติ (BATCH-timestamp)
3. **หลาย Batch**: สามารถเพิ่มหลาย Batch ได้ สต็อกจะรวมกัน
4. **Quantity = 0**: ถ้าต้องการให้สินค้าแสดงแต่ยังไม่มีขาย ให้กรอก 0

---

## 📞 ติดต่อ Support

หากพบปัญหา:
1. ตรวจสอบ Backend Log หา warning
2. ตรวจสอบ Database ด้วย SQL query ด้านบน
3. ตรวจสอบว่า Quantity ถูกกรอกหรือไม่

---

## 🎓 สรุป

**Batch System = ระบบจัดการสต็อกสินค้า**

- ✅ **Quantity** = จำนวนสินค้า (ฟิลด์สำคัญที่สุด!)
- ✅ Batch Number = รหัสล็อต
- ✅ Dates = วันผลิต/หมดอายุ
- ✅ ถ้าไม่กรอก Quantity = สินค้า 0 ชิ้น

**จำไว้**: ทุกครั้งที่เพิ่มสินค้า ต้องกรอก **Quantity** ในฟิลด์ Batch!
