'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: '🎉',
      title: 'ง่ายและรวดเร็ว',
      description: 'สร้างบิลปาร์ตี้และแชร์ลิงก์ให้เพื่อนได้ในไม่กี่วินาที',
    },
    {
      icon: '⚖️',
      title: 'แบ่งอย่างยุติธรรม',
      description: 'แต่ละคนแชร์เฉพาะเมนูที่กิน ไม่ต้องหารรวม',
    },
    {
      icon: '💬',
      title: 'สื่อสารได้',
      description: 'Request เมนูที่ไม่ได้กิน และแชทกับ Admin ได้',
    },
    {
      icon: '🔒',
      title: 'ไม่ต้อง Login',
      description: 'ใช้งานได้ทันที ไม่ต้องสร้างบัญชีหรือ login',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in drop-shadow-lg">
              กล้าหาร 💸
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto animate-fade-in font-semibold">
              แชร์บิลปาร์ตี้อย่างยุติธรรม
            </p>
            <p className="text-lg text-blue-50 mb-12 max-w-2xl mx-auto animate-fade-in">
              แบ่งค่าใช้จ่ายแบบละเอียด ใครกินอะไรก็แชร์เท่านั้น<br />ไม่ต้อง login ใช้งานง่าย ส่งลิงก์ให้เพื่อนได้เลย
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Button
                size="lg"
                onClick={() => router.push('/create')}
                className="bg-white text-blue-700 hover:bg-blue-50 shadow-2xl hover:shadow-white/40 border-2 border-white font-semibold text-lg px-8 py-4"
              >
                🎊 สร้างบิลใหม่
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  const billId = prompt('กรอก ID หรือ Link ของบิล:');
                  if (billId) {
                    // Extract ID from URL if full URL is provided
                    const id = billId.includes('/bill/')
                      ? billId.split('/bill/')[1].split('/')[0]
                      : billId;
                    router.push(`/bill/${id}`);
                  }
                }}
                className="bg-white/10 text-white border-2 border-white hover:bg-white/20 font-semibold text-lg px-8 py-4 backdrop-blur-sm"
              >
                🔍 เข้าสู่บิลที่มีอยู่
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          ทำไมต้อง Glaharn?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card key={index} hover className="text-center group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 dark:bg-gray-900 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            วิธีใช้งาน
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                สร้างบิล
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                กรอกชื่อปาร์ตี้ รายชื่อสมาชิก และข้อมูลการรับเงิน
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                เพิ่มรายการ
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                ใส่รายการอาหาร ราคา และระบุว่าใครจ่าย ใครกิน
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                แชร์ลิงก์
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                ส่งลิงก์ให้เพื่อนๆ ให้เขาเลือกชื่อและดูยอดที่ต้องจ่าย
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 border-none text-center shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            พร้อมที่จะแบ่งบิลอย่างยุติธรรม?
          </h2>
          <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto font-medium">
            เริ่มต้นใช้งานได้ฟรี ไม่ต้องสมัครสมาชิก
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/create')}
            className="bg-white text-blue-700 hover:bg-blue-50 shadow-2xl hover:shadow-white/40 font-semibold text-lg px-10 py-4 border-2 border-white"
          >
            สร้างบิลเลย! 🚀
          </Button>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400">
          <p>Made with ❤️ for fair bill splitting</p>
        </div>
      </footer>
    </div>
  );
}
