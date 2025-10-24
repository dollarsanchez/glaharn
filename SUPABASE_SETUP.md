# Supabase Storage Setup Guide

## ขั้นตอนการตั้งค่า Supabase Storage สำหรับ QR Code Images

### 1. เข้าไปที่ Supabase Dashboard

ไปที่: https://supabase.com/dashboard

### 2. สร้าง Storage Bucket

1. คลิกที่ **Storage** ในเมนูด้านซ้าย
2. คลิกปุ่ม **New bucket**
3. กรอกข้อมูล:
   - **Name**: `qr-codes`
   - **Public bucket**: ✅ เปิด (ติ๊กถูก)
   - **File size limit**: เว้นว่างไว้ (ใช้ default)
4. คลิก **Create bucket**

### 3. ตั้งค่า Security Policies

หลังจากสร้าง bucket แล้ว ต้องตั้งค่า policies เพื่อให้:
- ทุกคนอ่านได้ (public read)
- ทุกคนอัพโหลดได้ (public upload)

#### วิธีที่ 1: ใช้ SQL Editor (แนะนำ)

1. ไปที่ **SQL Editor** ในเมนูด้านซ้าย
2. คลิก **New query**
3. Copy และ Paste SQL นี้:

```sql
-- Policy สำหรับให้ทุกคนอ่านได้
CREATE POLICY "Anyone can view QR codes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-codes');

-- Policy สำหรับให้ทุกคนอัพโหลดได้
CREATE POLICY "Anyone can upload QR codes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'qr-codes');
```

4. คลิก **Run** เพื่อรัน SQL

### 4. ทดสอบการอัพโหลด

1. ไปที่ Storage → qr-codes
2. ลองคลิก **Upload file** เพื่ออัพโหลดรูปทดสอบ
3. หลังจากอัพโหลดแล้ว คลิกที่ไฟล์และเลือก **Copy URL**
4. ลองเปิด URL ในเบราว์เซอร์ใหม่เพื่อทดสอบว่าเข้าถึงได้

### 5. เสร็จสิ้น!

ตอนนี้ระบบ QR Code Upload พร้อมใช้งานแล้ว 🎉

## การใช้งานในระบบ

### สมาชิก (Member)
1. เมื่อสมาชิกมี balance > 0 (ควรได้รับเงิน)
2. จะเห็นปุ่ม "เพิ่มช่องทางรับเงิน"
3. เลือก "QR Code" แล้วอัพโหลดรูป
4. ระบบจะอัพโหลดไปที่ Supabase Storage และส่ง request ให้ Admin

### Admin
1. ไปที่แท็บ "คำขอ & คอมเมนต์"
2. จะเห็นคำขอเพิ่ม QR Code พร้อมกับรูปตัวอย่าง
3. คลิก "อนุมัติ" เพื่ออนุมัติ หรือ "ปฏิเสธ" เพื่อปฏิเสธ
4. เมื่ออนุมัติแล้ว สมาชิกทุกคนจะเห็น QR Code ในหน้า "ช่องทางรับเงิน"

## Troubleshooting

### รูปอัพโหลดไม่ขึ้น
- ตรวจสอบว่าได้สร้าง bucket ชื่อ `qr-codes` แล้วหรือยัง
- ตรวจสอบว่าได้ตั้งค่า policies แล้วหรือยัง
- ดูที่ Console (F12) เพื่อดู error messages

### เข้าถึงรูปไม่ได้
- ตรวจสอบว่า bucket เป็น **public** หรือไม่
- ตรวจสอบ SELECT policy ว่าถูกต้องหรือไม่

### ขนาดไฟล์ใหญ่เกินไป
- ระบบจำกัดขนาดไฟล์ที่ 5MB
- ลองย่อขนาดรูปก่อนอัพโหลด
