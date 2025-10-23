'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-xl">💰</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                กล้าหาร
              </span>
            </div>
            <Button
              onClick={() => router.push('/create')}
              size="sm"
            >
              สร้างบิล
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full mb-8 border border-indigo-100">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-indigo-700">ฟรีตลอดกาล ไม่ต้องสมัครสมาชิก</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              แบ่งบิลปาร์ตี้
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                อย่างยุติธรรม
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              คำนวณค่าใช้จ่ายแบบละเอียด ใครกินอะไรแชร์เท่านั้น<br className="hidden sm:block" />
              ไม่ต้องปวดหัวคิดเลข เราทำให้อัตโนมัติ
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                size="lg"
                onClick={() => router.push('/create')}
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
              >
                🔍 ดูบิลที่มีอยู่
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>ไม่ต้องลงทะเบียน</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>ใช้ฟรีทุกฟีเจอร์</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>ปลอดภัย 100%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ทำไมต้องใช้ <span className="text-indigo-600">กล้าหาร</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              เครื่องมือแบ่งบิลที่ครบครัน ใช้งานง่าย และฟรี
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: 'รวดเร็วและง่าย',
                description: 'สร้างบิลและแชร์ลิงก์ได้ภายใน 3 นาที ไม่ซับซ้อน',
                color: 'from-yellow-500 to-orange-500',
              },
              {
                icon: '⚖️',
                title: 'ยุติธรรม 100%',
                description: 'แต่ละคนจ่ายเฉพาะส่วนที่กิน คำนวณอัตโนมัติแม่นยำ',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                icon: '💳',
                title: 'รองรับทุกช่องทาง',
                description: 'PromptPay, QR Code, บัญชีธนาคาร ครบทุกรูปแบบ',
                color: 'from-emerald-500 to-teal-500',
              },
              {
                icon: '📱',
                title: 'ใช้ได้ทุกอุปกรณ์',
                description: 'Responsive ใช้งานได้ทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: '🔒',
                title: 'ไม่ต้อง Login',
                description: 'เริ่มใช้งานได้ทันที ไม่ต้องสร้างบัญชีหรือจำรหัสผ่าน',
                color: 'from-pink-500 to-rose-500',
              },
              {
                icon: '🔗',
                title: 'แชร์ง่ายๆ',
                description: 'ส่งลิงก์เดียวให้เพื่อนๆ ดูยอดเงินและช่องทางชำระได้เลย',
                color: 'from-violet-500 to-purple-500',
              },
            ].map((feature, index) => (
              <Card key={index} hover className="group">
                <div className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ใช้งานง่าย <span className="text-indigo-600">ใน 3 ขั้นตอน</span>
            </h2>
            <p className="text-lg text-gray-600">
              เริ่มต้นแบ่งบิลได้ทันที ไม่ซับซ้อน
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'สร้างบิล',
                description: 'กรอกชื่อปาร์ตี้ เพิ่มสมาชิก และระบุช่องทางรับเงิน',
                icon: '📝',
              },
              {
                step: '02',
                title: 'เพิ่มรายการ',
                description: 'ใส่รายการอาหาร ราคา ระบุใครจ่ายและใครกินบ้าง',
                icon: '🍜',
              },
              {
                step: '03',
                title: 'แชร์ลิงก์',
                description: 'ส่งลิงก์ให้เพื่อนๆ ดูยอดเงินและโอนคืนได้เลย',
                icon: '🎉',
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <Card className="h-full pt-12">
                  {/* Step Number Badge */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/30">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-6xl mb-4">{step.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">{step.description}</p>
                  </div>
                </Card>

                {/* Connector Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-12 h-0.5 bg-gradient-to-r from-indigo-300 to-transparent -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            พร้อมแบ่งบิลอย่างยุติธรรมแล้วหรือยัง?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            ไม่ต้องสมัครสมาชิก ไม่มีค่าใช้จ่าย เริ่มใช้งานได้ทันที
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/create')}
            className="bg-white text-indigo-600 hover:bg-gray-50 shadow-2xl hover:shadow-white/50"
          >
            ✨ สร้างบิลฟรีตอนนี้
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">💰</span>
              </div>
              <span className="text-2xl font-bold text-white">กล้าหาร</span>
            </div>
            <p className="mb-2">แบ่งบิลอย่างยุติธรรม ไม่ต้องปวดหัวคำนวณ</p>
            <p className="text-sm text-gray-500">
              Made with ❤️ for everyone who hates splitting bills manually
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
