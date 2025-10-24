'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                กล้าหาร
              </span>
            </div>
            <Button
              onClick={() => router.push('/create')}
              size="sm"
              className="px-6"
            >
              สร้างบิลใหม่
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-32 pb-20 sm:pb-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm font-semibold text-gray-700">ฟรี ใช้งานง่าย ไม่ต้องสมัครสมาชิก</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              แบ่งบิล
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                อย่างยุติธรรม
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              คำนวณค่าใช้จ่ายแบบละเอียด<br className="sm:hidden" /> ใครกินอะไรแชร์เท่านั้น
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                size="lg"
                onClick={() => router.push('/create')}
                className="px-10 py-5 text-lg font-semibold shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                🚀 สร้างบิลใหม่
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
                className="px-10 py-5 text-lg font-semibold bg-white hover:bg-gray-50 shadow-lg"
              >
                📋 ดูบิลที่มีอยู่
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
                className="px-10 py-5 text-lg font-semibold border-2 border-purple-300 hover:border-purple-400 bg-white hover:bg-gray-50 shadow-lg"
              >
                👑 Admin
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[
                { icon: '✓', text: 'ไม่ต้องลงทะเบียน' },
                { icon: '✓', text: 'ใช้ฟรีตลอดไป' },
                { icon: '✓', text: 'ปลอดภัย 100%' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ทำไมต้อง <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">กล้าหาร</span>
            </h2>
            <p className="text-xl text-gray-600">ระบบแบ่งบิลที่ดีที่สุด ใช้งานง่าย ครบทุกฟีเจอร์</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-6xl mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ใช้งานง่าย <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">3 ขั้นตอน</span>
            </h2>
            <p className="text-xl text-gray-600">เริ่มต้นใช้งานได้ภายใน 2 นาที</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'สร้างบิล',
                description: 'เพิ่มสมาชิกและช่องทางรับเงิน',
                icon: '📝',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                step: '2',
                title: 'เพิ่มรายการ',
                description: 'ระบุใครจ่ายและใครกินบ้าง',
                icon: '🍽️',
                color: 'from-purple-500 to-pink-500',
              },
              {
                step: '3',
                title: 'แชร์ลิงก์',
                description: 'ส่งให้เพื่อนๆ เพื่อโอนคืน',
                icon: '🎉',
                color: 'from-pink-500 to-rose-500',
              },
            ].map((step, index) => (
              <div key={index}>
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                  {/* Step Number Badge */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md`}>
                    <span className="text-white font-bold text-2xl">{step.step}</span>
                  </div>

                  {/* Icon */}
                  <div className="text-5xl mb-4 text-center">{step.icon}</div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-center">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 mb-8">
            <span className="text-sm font-semibold text-white">🎯 เริ่มต้นใช้งานได้เลย</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            พร้อมแบ่งบิล<br />แล้วหรือยัง?
          </h2>

          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            เริ่มต้นใช้งานฟรี ไม่ต้องสมัครสมาชิก ไม่มีค่าใช้จ่ายแอบแฝง
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push('/create')}
              className="bg-white text-indigo-600 hover:bg-gray-50 px-10 py-5 text-lg font-semibold shadow-lg"
            >
              🚀 สร้างบิลฟรีตอนนี้
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                const billId = prompt('กรอก Bill ID หรือลิงก์:');
                if (billId) {
                  const id = billId.split('/').pop()?.split('?')[0] || billId;
                  router.push(`/bill/${id}`);
                }
              }}
              className="border-2 border-white text-white hover:bg-white/10 px-10 py-5 text-lg font-semibold"
            >
              📋 ดูบิลที่มีอยู่
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200 py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                กล้าหาร
              </span>
            </div>
            <p className="text-gray-600 mb-6 text-lg">
              แบ่งบิลอย่างยุติธรรม ไม่ต้องปวดหัวคำนวณ
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>Made with</span>
              <span className="text-red-500">❤️</span>
              <span>in Thailand</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
