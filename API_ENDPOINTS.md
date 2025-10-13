# SupplyGo API Endpoints

Base URL: `http://localhost:4000/api`

## 🔐 Authentication
- **POST** `/register` - สมัครสมาชิก
- **POST** `/login` - เข้าสู่ระบบ
- **GET** `/check-role` - ตรวจสอบ role ของ user (ต้อง Auth)

## 👤 User Management
- **GET** `/loadusername` - โหลดชื่อผู้ใช้ (ต้อง Auth)
- **GET** `/address` - ดูที่อยู่ทั้งหมด (ต้อง Auth)
- **POST** `/add-address` - เพิ่มที่อยู่ใหม่ (ต้อง Auth)

## 🏪 Shop Management
- **GET** `/loadstorename` - โหลดชื่อร้านค้า
- **POST** `/regisstripe` - ลงทะเบียน Stripe สำหรับร้านค้า
- **GET** `/connect` - เชื่อมต่อ Stripe
- **GET** `/manageproducts` - จัดการสินค้าในร้าน (ต้อง Auth + Shop)

## 📦 Product Management
- **POST** `/add-product` - เพิ่มสินค้าใหม่ (Upload + ต้อง Auth)
- **GET** `/loaduserproduct` - โหลดสินค้าของร้าน
- **GET** `/products` - ดูสินค้าตาม category
- **PATCH** `/primary-picture` - ตั้งภาพหลักของสินค้า

## 🛒 Cart Management
- **GET** `/cart` - ดูตะกร้าสินค้า (ต้อง Auth)
- **POST** `/addtocart` - เพิ่มสินค้าลงตะกร้า (ต้อง Auth)
- **DELETE** `/remove-cart` - ลบสินค้าจากตะกร้า (ต้อง Auth)

## 🛍️ Order Management
- **POST** `/order-success` - สร้างคำสั่งซื้อ (ต้อง Auth)
- **GET** `/orderhistory` - ประวัติการสั่งซื้อ (ต้อง Auth)
- **GET** `/shoporderhistory` - ประวัติคำสั่งซื้อของร้าน
- **POST** `/confirm-orders` - ยืนยันคำสั่งซื้อ
- **POST** `/create-order` - สร้างคำสั่งซื้อใหม่
- **POST** `/cancel-order` - ยกเลิกคำสั่งซื้อ

## 💰 Payment & Stripe
- **POST** `/payment-intent` - สร้าง Payment Intent
- **POST** `/payment-multivendor` - จ่ายเงินแบบหลายร้านค้า
- **POST** `/save-transaction` - บันทึกธุรกรรม

## 📊 Categories
- **GET** `/categories` - ดูหมวดหมู่สินค้าทั้งหมด
- **POST** `/createcategories` - สร้างหมวดหมู่ใหม่ (ต้อง Auth + Admin)

## 👥 Group Buying (การซื้อแบบกลุ่ม)
- **GET** `/loadbalance` - ดูยอดเงินคงเหลือ
- **GET** `/loadgroupbuy` - ดูกลุ่มซื้อที่มี
- **POST** `/topup-point` - เติมเงินเข้าระบบ
- **POST** `/confirm-topup` - ยืนยันการเติมเงิน
- **POST** `/create-group` - สร้างกลุ่มซื้อ (Shop)
- **GET** `/manage-groups` - จัดการกลุ่มซื้อ (Shop)
- **POST** `/join-group` - เข้าร่วมกลุ่มซื้อ (Customer)
- **POST** `/leave-group` - ออกจากกลุ่มซื้อ (Customer)
- **GET** `/check-join-group` - ตรวจสอบการเข้าร่วมกลุ่ม
- **POST** `/confirm-group-order` - ยืนยันคำสั่งซื้อกลุ่ม (Shop)
- **POST** `/cancel-group-order` - ยกเลิกคำสั่งซื้อกลุ่ม (Shop)
- **GET** `/history-group` - ประวัติกลุ่มซื้อ (Customer)
- **POST** `/withdraw` - ถอนเงิน (Shop)

## 🔧 Admin Panel
- **GET** `/admin-dashboard` - หน้าแดชบอร์ดแอดมิน (ต้อง Auth + Admin)
- **GET** `/load-withdraw` - ดูคำขอถอนเงินทั้งหมด (Admin)
- **POST** `/approve-withdraw` - อนุมัติการถอนเงิน (Admin)
- **GET** `/payment-history` - ประวัติการจ่ายเงินทั้งหมด (Admin)
- **GET** `/all-order-history` - ประวัติคำสั่งซื้อทั้งหมด (Admin)

## 📁 File Upload
- **POST** `/upload` - อัปโหลดไฟล์

## 🖼️ Static Files
- **GET** `/upload/*` - ดูไฟล์ที่อัปโหลด
- **GET** `/images/*` - ดูรูปภาพ

---

## 📝 Test Commands

### Authentication
```bash
# Register
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass","email":"test@email.com","role":"customer"}'

# Login
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

### Products
```bash
# Get categories
curl -X GET http://localhost:4000/api/categories

# Get products by category
curl -X GET "http://localhost:4000/api/products?category_id=1"
```

### Cart (ต้องมี Authorization header)
```bash
# Add to cart
curl -X POST http://localhost:4000/api/addtocart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"product_id":1,"quantity":2}'

# View cart
curl -X GET http://localhost:4000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔑 Authentication Notes
- Routes ที่มี `(ต้อง Auth)` จำเป็นต้องส่ง `Authorization: Bearer <token>` ใน header
- Routes ที่มี `(ต้อง Auth + Shop)` ต้องเป็น user ที่มี role เป็น shop หรือ admin
- Routes ที่มี `(ต้อง Auth + Admin)` ต้องเป็น user ที่มี role เป็น admin

## 🗂️ Request Body Examples

### Register
```json
{
  "username": "john_doe",
  "password": "securepassword",
  "email": "john@example.com",
  "role": "customer" // หรือ "shop", "admin"
}
```

### Add to Cart
```json
{
  "product_id": 1,
  "quantity": 2,
  "variant_id": 1, // optional
  "option_value_id": [1, 2] // optional array
}
```

### Add Address
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "phone_number": "0812345678",
  "house_number": "123",
  "street": "Main Street",
  "sub_district": "Subdistrict",
  "district": "District",
  "province": "Province",
  "postal_code": "12345",
  "address_type": "home"
}
```