'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                กล้าหาร
              </span>
            </div>
            <Button
              onClick={() => router.push('/create')}
              size="sm"
              className="px-6"
            >
              สร้างบิล
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-6 sm:mb-8 leading-[1.1] tracking-tight">
              แบ่งบิล
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                อย่างยุติธรรม
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-500 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
              คำนวณค่าใช้จ่ายแบบละเอียด ใครกินอะไรแชร์เท่านั้น
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                size="lg"
                onClick={() => router.push('/create')}
                className="px-8 py-4 text-lg"
              >
                สร้างบิลใหม่
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  const billId = prompt('กรอก Bill ID หรือลิงก์:');
                  if (billId) {
                    const id = billId.split('/').pop()?.split('?')[0] || billId;
                    router.push(`/bill/${id}`);
                  }
                }}
                className="px-8 py-4 text-lg"
              >
                ดูบิลที่มีอยู่
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  const billId = prompt('กรอก Bill ID:');
                  if (billId) {
                    const id = billId.split('/').pop()?.split('?')[0] || billId;
                    const adminCode = prompt('กรอกรหัส Admin (6 ตัวอักษร):');
                    if (adminCode) {
                      router.push(`/bill/${id}/admin?code=${adminCode.toUpperCase()}`);
                    }
                  }
                }}
                className="px-8 py-4 text-lg border-2 border-indigo-600 hover:bg-indigo-50"
              >
                👑 เข้าสู่ระบบ Admin
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>ไม่ต้องลงทะเบียน</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>ใช้ฟรี</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>ปลอดภัย</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: '⚖️',
                title: 'ยุติธรรม',
                description: 'แต่ละคนจ่ายเฉพาะส่วนที่กิน คำนวณอัตโนมัติแม่นยำ',
              },
              {
                icon: '⚡',
                title: 'รวดเร็ว',
                description: 'สร้างบิลและแชร์ลิงก์ได้ภายในไม่กี่นาที',
              },
              {
                icon: '🔒',
                title: 'ปลอดภัย',
                description: 'ไม่ต้อง Login เริ่มใช้งานได้ทันที',
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ใช้งานง่าย <span className="text-indigo-600">3 ขั้นตอน</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              {
                step: '1',
                title: 'สร้างบิล',
                description: 'เพิ่มสมาชิกและช่องทางรับเงิน',
              },
              {
                step: '2',
                title: 'เพิ่มรายการ',
                description: 'ระบุใครจ่ายและใครกินบ้าง',
              },
              {
                step: '3',
                title: 'แชร์ลิงก์',
                description: 'ส่งให้เพื่อนๆ เพื่อโอนคืน',
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <span className="text-white font-bold text-xl">{step.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
            พร้อมแบ่งบิลแล้วหรือยัง?
          </h2>
          <Button
            size="lg"
            onClick={() => router.push('/create')}
            className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-4 text-lg"
          >
            สร้างบิลฟรี
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">กล้าหาร</span>
            </div>
            <p className="text-sm text-gray-400">
              แบ่งบิลอย่างยุติธรรม ไม่ต้องปวดหัวคำนวณ
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
