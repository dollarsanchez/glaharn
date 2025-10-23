# 🔧 วิธีเชื่อมต่อ Supabase กับ Glaharn

คู่มือนี้จะแนะนำทีละขั้นตอนในการเชื่อมต่อโปรเจค Glaharn กับ Supabase

## 📋 ขั้นตอนที่ 1: เตรียม Supabase Project

### 1.1 สร้าง Project ใน Supabase

1. ไปที่ [https://app.supabase.com](https://app.supabase.com)
2. Login ด้วย GitHub account
3. คลิก "New Project"
4. กรอกข้อมูล:
   - **Name**: `glaharn` (หรือชื่อที่ต้องการ)
   - **Database Password**: สร้างรหัสผ่านที่แข็งแรง (จดไว้!)
   - **Region**: เลือก `Southeast Asia (Singapore)` (ใกล้ที่สุด)
5. คลิก "Create new project"
6. รอประมาณ 1-2 นาทีให้ database พร้อม

### 1.2 สร้าง Table `bills`

1. ใน Supabase Dashboard ไปที่ **Table Editor** (เมนูด้านซ้าย)
2. คลิก **New table**
3. กรอกข้อมูล:
   - **Name**: `bills`
   - ติ๊กถูก **Enable Row Level Security (RLS)**
4. สร้าง Columns ดังนี้:

| Column Name | Type      | Default Value                | Primary | Nullable |
|-------------|-----------|------------------------------|---------|----------|
| id          | text      | -                            | ✅ Yes  | No       |
| name        | text      | -                            | No      | No       |
| admin_id    | text      | -                            | No      | No       |
| created_at  | timestamp | now()                        | No      | No       |
| data        | jsonb     | -                            | No      | No       |

5. คลิก **Save**

### 1.3 ตั้งค่า RLS (Row Level Security)

เนื่องจากแอปนี้ไม่มี authentication ต้องอนุญาตให้ทุกคนอ่านและเขียนได้

1. ไปที่ **Authentication > Policies** (หรือในหน้า Table Editor คลิกที่ปุ่ม RLS)
2. คลิก **New Policy** สำหรับ table `bills`
3. เลือก **For full customization**
4. กรอก:
   - **Policy name**: `Allow public read/write`
   - **Target roles**: เลือก `public`
   - **Policy command**: เลือก `ALL`
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`
5. คลิก **Review** แล้ว **Save policy**

⚠️ **หมายเหตุ**: นี่คือการตั้งค่าแบบเปิดกว้าง เหมาะสำหรับ MVP/Prototype เท่านั้น!
สำหรับ production ควรมีการ authentication และจำกัดสิทธิ์ให้เหมาะสม

## 📋 ขั้นตอนที่ 2: คัดลอก API Keys

1. ไปที่ **Project Settings** (ไอคอนเฟืองด้านล่างซ้าย)
2. ไปที่ **API** (เมนูด้านซ้าย)
3. คัดลอกค่าเหล่านี้:
   - **Project URL** (ใต้หัวข้อ "Project URL")
   - **anon/public key** (ใต้หัวข้อ "Project API keys")

## 📋 ขั้นตอนที่ 3: ตั้งค่า Environment Variables

1. เปิดไฟล์ `.env.local` ในโปรเจค
2. กรอกค่าที่คัดลอกมา:

```bash
# แทนค่าด้านล่างนี้ด้วยค่าจริงจาก Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

3. **บันทึกไฟล์**

## 📋 ขั้นตอนที่ 4: ทดสอบการเชื่อมต่อ

1. ปิด dev server (ถ้ารันอยู่)
2. รัน dev server ใหม่:

```bash
npm run dev
```

3. เปิดเบราว์เซอร์ที่ `http://localhost:3000`
4. ลองสร้างบิลทดสอบ:
   - คลิก "สร้างบิลใหม่"
   - กรอกข้อมูลครบทุกขั้นตอน
   - สร้างบิล

5. ตรวจสอบใน Supabase:
   - ไปที่ **Table Editor** > **bills**
   - ควรเห็นข้อมูลบิลที่สร้างใหม่

✅ **สำเร็จ!** ถ้าเห็นข้อมูลใน Supabase แสดงว่าการเชื่อมต่อสำเร็จแล้ว!

## 📋 ขั้นตอนที่ 5: Deploy ไป Vercel

### 5.1 เตรียม Git Repository

```bash
# ถ้ายังไม่ได้ init git
git init
git add .
git commit -m "Initial commit with Supabase integration"

# สร้าง repo ใหม่ใน GitHub แล้ว push
git remote add origin https://github.com/your-username/glaharn.git
git push -u origin main
```

### 5.2 Deploy ด้วย Vercel

1. ไปที่ [https://vercel.com](https://vercel.com)
2. Login ด้วย GitHub
3. คลิก **Add New...** > **Project**
4. เลือก repository `glaharn`
5. คลิก **Import**
6. ใน **Environment Variables** เพิ่ม:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGci...`
7. คลิก **Deploy**
8. รอประมาณ 1-2 นาที
9. ✅ เสร็จสิ้น! จะได้ URL เช่น `https://glaharn.vercel.app`

### 5.3 ตั้งค่า Custom Domain (Optional)

1. ใน Vercel Dashboard ไปที่ **Settings** > **Domains**
2. กรอก domain ที่ต้องการ (ซื้อจาก Namecheap, GoDaddy ฯลฯ)
3. ตั้งค่า DNS ตามที่ Vercel บอก
4. รอ DNS propagate (15-60 นาที)

## 🔧 Troubleshooting

### ปัญหา: ข้อมูลไม่บันทึกลง Supabase

**วิธีแก้:**
1. เช็ค Console ใน Browser (F12) ดู error
2. ตรวจสอบว่า `.env.local` มีค่าถูกต้อง
3. Restart dev server
4. ตรวจสอบ RLS policies ใน Supabase

### ปัญหา: CORS Error

**วิธีแก้:**
1. ไปที่ Supabase **Project Settings** > **API**
2. เพิ่ม domain ของคุณใน **Allowed Origins**
3. สำหรับ localhost: `http://localhost:3000`
4. สำหรับ Vercel: `https://glaharn.vercel.app` (หรือ domain ของคุณ)

### ปัญหา: Cannot find module '@supabase/supabase-js'

**วิธีแก้:**
```bash
npm install @supabase/supabase-js
```

### ปัญหา: Environment variables ไม่ทำงาน

**วิธีแก้:**
1. ตรวจสอบว่าชื่อขึ้นต้นด้วย `NEXT_PUBLIC_`
2. Restart dev server
3. ใน Vercel: ตรวจสอบว่าเพิ่ม env vars ใน Dashboard แล้ว
4. Redeploy โปรเจค

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Deployment Guide](https://vercel.com/docs/concepts/deployments/overview)

## 🎉 เสร็จสิ้น!

ตอนนี้แอป Glaharn ของคุณพร้อมใช้งานแล้ว! 🚀

- ข้อมูลจะถูกเก็บใน Supabase (cloud database)
- สามารถ share link ให้เพื่อนๆ ได้
- รองรับการใช้งานพร้อมกันหลายคน
- ข้อมูลจะไม่หายแม้ปิดเบราว์เซอร์
