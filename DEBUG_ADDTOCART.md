# 🛒 การแก้ไขปัญหา Add to Cart Error 400

## 📋 สรุปปัญหา
เกิด error `Request failed with status code 400` เมื่อพยายามเพิ่มสินค้าลงตะกร้า

## 🔍 สาเหตุที่พบ

### 1. Token Authentication
- **ปัญหา**: Token อาจหมดอายุหรือไม่ถูกต้อง ทำให้ server ตอบกลับด้วย 401/403
- **ผลกระทบ**: ผู้ใช้ไม่สามารถเพิ่มสินค้าลงตะกร้าได้

### 2. Error Handling ไม่ชัดเจน
- **ปัญหา**: Error message ที่แสดงไม่บอกรายละเอียดว่าเกิดอะไรขึ้น
- **ผลกระทบ**: ยากต่อการ debug และแก้ไข

## ✅ การแก้ไขที่ทำ

### 1. ปรับปรุงไฟล์ `addtocart.ts`
**ไฟล์**: `/web-front/src/service/api/addtocart.ts`

#### เพิ่มการจัดการ Token Error
```typescript
// จัดการกรณี token หมดอายุหรือไม่ถูกต้อง
if (err.response?.status === 401 || err.response?.status === 403) {
  localStorage.removeItem("token");
  const tokenError = err.response?.data?.message || "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่";
  console.error("🔐 Token error:", tokenError);
  throw new Error(tokenError);
}
```

#### ปรับปรุง Error Messages
```typescript
const errorMsg =
  err.response?.data?.error || 
  err.response?.data?.message || 
  err.message || 
  "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้";
```

#### เปิด Console Logging
```typescript
console.log("🔔 API call addtocart with:", { product_id, quantity, variant_id, option_value_id });

console.error("❌ Add to cart error:", {
  status: err.response?.status,
  message: errorMsg,
  data: err.response?.data
});
```

### 2. ปรับปรุง Error Handling ในหน้า UI
**ไฟล์ที่แก้ไข**:
- `/web-front/src/app/page.tsx`
- `/web-front/src/app/home/page.tsx`
- `/web-front/src/app/category/[categoryName]/page.tsx`

#### เพิ่มการแสดง Error Message ที่ชัดเจน
```typescript
catch (error) {
  console.error("❌ ไม่สามารถเพิ่มสินค้าลงตะกร้าได้:", error);
  const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดขณะเพิ่มสินค้า';
  alert(errorMessage);
  
  // ถ้า error เกี่ยวกับ token ให้ redirect ไป login
  if (errorMessage.includes('Session') || errorMessage.includes('เข้าสู่ระบบ')) {
    router.push('/login');
  }
}
```

### 3. เปิด Debug Logging ฝั่ง Backend
**ไฟล์**: `/web-back/src/routes/addtocartRoute.ts`

```typescript
console.log("📥 รับข้อมูลจาก client:", {
  product_id,
  quantity,
  variant_id,
  option_value_id,
  userId,
  body: req.body
});
```

## 🧪 วิธีการทดสอบ

### 1. ตรวจสอบ Token
```javascript
// เปิด Console ในเบราว์เซอร์
console.log("Token:", localStorage.getItem("token"));
```

### 2. ทดสอบ Login ใหม่
1. ลบ token เดิม: `localStorage.removeItem("token")`
2. Login ใหม่
3. ทดสอบเพิ่มสินค้าลงตะกร้า

### 3. ตรวจสอบ Network Tab
- เปิด DevTools → Network
- กด "Add to Cart"
- ดู Request Headers ว่ามี Authorization header หรือไม่
- ดู Response เพื่อดู error message ที่แท้จริง

## 📊 ตัวอย่าง Error Messages

| Status Code | ข้อความที่แสดง | การแก้ไข |
|-------------|----------------|----------|
| 401 | "Access token missing" | Login ใหม่ |
| 403 | "Invalid or expired token" | Login ใหม่ |
| 400 | "ข้อมูลไม่ครบถ้วน: ต้องมี product_id และ quantity" | ตรวจสอบข้อมูลที่ส่ง |
| 400 | "ไม่พบสินค้า" | ตรวจสอบ product_id |
| 400 | "สินค้าไม่พร้อมจำหน่าย" | เลือกสินค้าอื่น |

## 🔧 การ Debug เพิ่มเติม

### ตรวจสอบ Console Logs
**Frontend**:
```
🔔 API call addtocart with: { product_id, quantity, variant_id, option_value_id }
❌ Add to cart error: { status, message, data }
```

**Backend**:
```
📥 รับข้อมูลจาก client: { product_id, quantity, variant_id, option_value_id, userId }
```

### ตรวจสอบ JWT Token
```bash
# ใช้ jwt.io หรือ terminal
node -e "console.log(JSON.parse(Buffer.from('YOUR_TOKEN_PAYLOAD'.split('.')[1], 'base64').toString()))"
```

## 🎯 ขั้นตอนถัดไป

1. ✅ Login ใหม่เพื่อรับ token ที่ valid
2. ✅ ทดสอบเพิ่มสินค้าลงตะกร้า
3. ✅ ตรวจสอบ console logs ทั้งฝั่ง frontend และ backend
4. ⚠️ ถ้ายังมีปัญหา ให้ตรวจสอบ:
   - Database connection
   - Product และ Variant มีอยู่จริงในฐานข้อมูล
   - Shop_id ของสินค้าถูกต้อง

## 📝 หมายเหตุ

- Token มีอายุ 1 ชั่วโมง (3600 วินาที) ตาม JWT configuration
- หาก token หมดอายุ ระบบจะ redirect ไปหน้า login อัตโนมัติ
- ข้อความ error ถูกแปลเป็นภาษาไทยเพื่อความเข้าใจง่าย
