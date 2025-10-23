# 💸 กล้าหาร (Glaharn)

**แชร์บิลปาร์ตี้อย่างยุติธรรม** - แอปพลิเคชันแบ่งค่าใช้จ่ายที่ละเอียด ยุติธรรม และใช้งานง่าย

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwind-css)

## ✨ Features

- 🎉 **ง่ายและรวดเร็ว** - สร้างบิลและแชร์ลิงก์ได้ในไม่กี่วินาที
- ⚖️ **แบ่งอย่างยุติธรรม** - แต่ละคนแชร์เฉพาะเมนูที่กิน ไม่ต้องหารรวมทั้งบิล
- 👑 **Admin Dashboard** - จัดการบิล เพิ่มรายการ ดูสรุปยอดได้อย่างสะดวก
- 👥 **Member View** - สมาชิกดูยอดที่ต้องจ่าย ช่องทางการโอนเงิน และรายการที่หาร
- 💰 **การคำนวณอัตโนมัติ** - คำนวณการแบ่งเงินแบบละเอียดและยุติธรรม
- 📱 **Responsive Design** - ใช้งานได้ลื่นไหลทุก Device (Desktop, Tablet, Mobile)
- 🔒 **No Login Required** - ใช้งานได้ทันที ไม่ต้องสมัครสมาชิก
- 🎨 **Modern UI/UX** - ออกแบบสวยงาม ใช้งานง่าย มี animations และ transitions

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x หรือสูงกว่า
- npm หรือ yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd glaharn

# Install dependencies
npm install

# Run development server
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 📖 How to Use

### สำหรับ Admin (ผู้สร้างบิล)

1. **สร้างบิลใหม่** - คลิก "สร้างบิลใหม่" จากหน้าหลัก
2. **กรอกข้อมูลพื้นฐาน** - ชื่อปาร์ตี้/บิล
3. **เพิ่มสมาชิก** - ใส่รายชื่อคนที่มาร่วมงาน (อย่างน้อย 2 คน)
4. **เพิ่มวิธีการรับเงิน** - พร้อมเพย์, QR Code, หรือบัญชีธนาคาร
5. **เพิ่มรายการอาหาร** - ชื่อเมนู, ราคา, ใครจ่าย, และใครกิน
6. **ดู Summary** - ระบบจะคำนวณและแสดงว่าใครต้องจ่ายให้ใครเท่าไหร่
7. **แชร์ลิงก์** - ส่งลิงก์ให้สมาชิกเพื่อให้พวกเขาดูข้อมูล
8. **เก็บรหัส Admin** - จดรหัส 6 หลักไว้เพื่อเข้าหน้า Admin ในครั้งถัดไป

### สำหรับ Member (สมาชิก)

1. **เปิดลิงก์** - จาก Admin
2. **เลือกชื่อตัวเอง** - จากรายชื่อสมาชิก
3. **ดูข้อมูล** - ยอดที่ต้องหาร, ยอดที่จ่ายไป, และยอดสุทธิ
4. **ดูรายการโอนเงิน** - ต้องจ่ายให้ใคร หรือจะได้รับเงินจากใครบ้าง
5. **ดูช่องทางการโอนเงิน** - พร้อมเพย์, QR Code, หรือเลขบัญชี
6. **คัดลอกลิงก์** - แชร์ต่อให้เพื่อนๆ ได้

## 🏗️ Project Structure

```
glaharn/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── create/            # Create bill wizard
│   │   └── bill/[id]/         # Bill views
│   │       ├── page.tsx       # Member view
│   │       └── admin/         # Admin dashboard
│   ├── components/            # React components
│   │   └── ui/                # Reusable UI components
│   ├── context/               # React Context (State Management)
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript types
├── public/                    # Static assets
└── package.json
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **State Management:** React Context API
- **Storage:** Browser LocalStorage
- **Font:** Geist Sans & Geist Mono
- **Icons:** Unicode Emojis

## 🎨 Design Principles

- **Modern & Beautiful** - Gradient backgrounds, smooth animations, card-based layouts
- **Responsive First** - Mobile-friendly design with responsive breakpoints
- **Accessible** - Good contrast ratios, readable fonts, clear labels
- **User-Friendly** - Clear visual hierarchy, helpful messages, easy navigation
- **Dark Mode Support** - Automatic dark mode based on system preference

## 📊 Key Features Explained

### การคำนวณการแบ่งเงิน

แอปใช้ algorithm แบบ greedy เพื่อคำนวณ transactions ที่น้อยที่สุด:

1. คำนวณยอดรวมที่แต่ละคนต้องหาร (จากรายการที่เลือก)
2. คำนวณยอดรวมที่แต่ละคนจ่ายไป
3. หา balance ของแต่ละคน (จ่าย - หาร)
4. จับคู่คนที่ต้องจ่ายกับคนที่ต้องรับเงิน เพื่อลด transactions ให้น้อยที่สุด

### State Management

ใช้ React Context API เพื่อ:
- จัดการ bills ทั้งหมดในแอป
- Sync กับ localStorage อัตโนมัติ
- Share state ระหว่าง components
- CRUD operations สำหรับ members, items, payment methods

### Security

- Admin access ด้วยรหัส 6 หลัก (random generated)
- ไม่มี sensitive data บน server (ทั้งหมดอยู่ใน localStorage)
- Simple URL sharing สำหรับ members

## 🚧 Future Enhancements

- [ ] Request system - Members สามารถ request ไม่หารเมนูบางอย่างได้
- [ ] Comment system - Members สามารถ comment หา Admin ได้
- [ ] Image upload - Upload รูปสลิป/QR Code ได้
- [ ] Export PDF - Export summary เป็น PDF
- [ ] Multiple currencies - รองรับสกุลเงินอื่นๆ
- [ ] PWA support - Install เป็น app บนมือถือได้
- [ ] Backend integration - Sync across devices

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with Next.js, TypeScript, and Tailwind CSS
- Designed for fair and easy bill splitting
- Made with ❤️ for parties and gatherings
