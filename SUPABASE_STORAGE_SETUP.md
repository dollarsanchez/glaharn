# วิธีตั้งค่า Supabase Storage สำหรับ QR Code Upload

## ปัญหา
Member ไม่สามารถส่งคำขอเพิ่มช่องทางรับเงินประเภท "QR Code" ได้ แต่ "พร้อมเพย์" และ "บัญชีธนาคาร" ทำงานได้ปกติ

## สาเหตุ
Supabase Storage bucket ชื่อ `qr-codes` ยังไม่ได้สร้างหรือไม่มี permission ให้ upload

## วิธีแก้ไข

### 1. เข้าสู่ Supabase Dashboard
1. ไปที่ https://supabase.com/dashboard
2. เลือก Project ของคุณ
3. ไปที่เมนู **Storage** ทางซ้ายมือ

### 2. สร้าง Storage Bucket
1. คลิก **"Create a new bucket"** หรือ **"New bucket"**
2. ตั้งค่าดังนี้:
   - **Name**: `qr-codes` (ต้องตรงกับค่าใน code)
   - **Public bucket**: ✅ **เปิด** (ต้องเป็น public เพื่อให้เข้าถึง URL ได้)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp` (ถ้ามีให้ใส่)
   - **Maximum file size**: `5242880` (5MB) (ถ้ามีให้ใส่)
3. คลิก **Create bucket**

### 3. ตั้งค่า Storage Policy (สำคัญมาก!)

หลังจากสร้าง bucket แล้ว คุณต้องตั้งค่า Policy เพื่อให้ทุกคนสามารถ upload ได้:

1. ไปที่เมนู **Storage** → เลือก bucket `qr-codes`
2. ไปที่แท็บ **Policies**
3. คลิก **New Policy** → เลือก **For full customization**

#### Policy 1: อนุญาตให้ทุกคนอัปโหลด (INSERT)
```sql
-- Policy name: Allow public uploads
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'qr-codes');
```

#### Policy 2: อนุญาตให้ทุกคนดูรูป (SELECT)
```sql
-- Policy name: Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-codes');
```

#### หรือใช้ UI แทน SQL:
1. คลิก **New Policy**
2. เลือก template **"Allow public access"** หรือสร้างเอง:
   - **Policy name**: `Allow public uploads`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `public`
   - **USING expression**: (ไม่ต้องใส่)
   - **WITH CHECK expression**: `bucket_id = 'qr-codes'`

3. ทำซ้ำสำหรับ SELECT operation

### 4. ทดสอบ
1. ล้าง cache และ refresh หน้าเว็บ
2. ลองส่งคำขอเพิ่มช่องทางรับเงินแบบ QR Code อีกครั้ง
3. เปิด Console (F12) ดู log:
   - ✅ ถ้าเห็น `✅ Upload successful!` = สำเร็จ
   - ❌ ถ้าเห็น `❌ Upload error:` = ยังมีปัญหา (อ่าน error message)

## ตรวจสอบว่าสำเร็จหรือไม่

1. ไปที่ Supabase Dashboard → Storage → `qr-codes` bucket
2. ถ้ามีโฟลเดอร์ชื่อ bill ID ปรากฏขึ้น = อัปโหลดสำเร็จ
3. คลิกดูรูปภาพได้ = URL ใช้งานได้

## ทางเลือกอื่น (ถ้ายังใช้ไม่ได้)

ถ้าไม่ต้องการใช้ Supabase Storage สามารถใช้วิธีอื่นได้:

### Option 1: ใช้ Base64 (ง่ายที่สุด แต่ไม่แนะนำถ้ามีรูปเยอะ)
แปลงรูปเป็น Base64 string และเก็บใน database โดยตรง (ทำให้ database ใหญ่ขึ้น)

### Option 2: ใช้บริการอื่น
- Cloudinary (ฟรี 25GB/เดือน)
- ImgBB (ฟรีไม่จำกัด)
- Uploadcare

## หมายเหตุ

- ชื่อ bucket **ต้องเป็น `qr-codes`** ตรงกับที่กำหนดในไฟล์ `src/lib/storage.ts:3`
- ถ้าต้องการเปลี่ยนชื่อ bucket ให้ไปแก้ที่ `BUCKET_NAME` ในไฟล์นั้น
- รูป QR Code จะถูกเก็บใน path: `qr-codes/{billId}/{timestamp}-{random}.{ext}`
