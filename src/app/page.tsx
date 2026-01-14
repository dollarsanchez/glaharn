'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          <div className="text-center">
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              แบ่งบิล
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                อย่างยุติธรรม
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              คำนวณค่าใช้จ่ายแบบละเอียด ใครกินอะไรแชร์เท่านั้น
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => router.push('/create')}
                className="w-full sm:w-auto px-12 py-6 text-lg font-semibold shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
                className="w-full sm:w-auto px-12 py-6 text-lg font-semibold bg-white hover:bg-gray-50 shadow-lg"
              >
                ดูบิลที่มีอยู่
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  const billId = prompt('กรอก Link Bill:');
                  if (billId) {
                    const id = billId.split('/').pop()?.split('?')[0] || billId;
                    const adminCode = prompt('กรอกรหัส Admin (6 ตัวอักษร):');
                    if (adminCode) {
                      router.push(`/bill/${id}/admin?code=${adminCode.toUpperCase()}`);
                    }
                  }
                }}
                className="w-full sm:w-auto px-12 py-6 text-lg font-semibold border-2 border-purple-300 hover:border-purple-400 bg-white hover:bg-purple-50 shadow-lg"
              >
                Admin
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-500">
            Made with <span className="text-red-500">❤️</span> in Thailand
          </p>
        </div>
      </footer>
    </div>
  );
}
