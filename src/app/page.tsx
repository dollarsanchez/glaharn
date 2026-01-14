'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [billIdInput, setBillIdInput] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  // Scroll animation states
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const howItWorksRef = useRef<HTMLElement>(null);
  const adminSectionRef = useRef<HTMLElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) {
              setVisibleSections((prev) => new Set([...prev, id]));
            }
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = [howItWorksRef, adminSectionRef, step1Ref, step2Ref, step3Ref];
    sections.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const handleViewBill = () => {
    if (billIdInput) {
      const id = billIdInput.split('/').pop()?.split('?')[0] || billIdInput;
      router.push(`/bill/${id}`);
    }
  };

  const handleAdminAccess = () => {
    if (billIdInput && adminCode) {
      const id = billIdInput.split('/').pop()?.split('?')[0] || billIdInput;
      router.push(`/bill/${id}/admin?code=${adminCode.toUpperCase()}`);
    }
  };

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-purple-300/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-300/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-gradient-to-br from-pink-200/30 to-rose-300/20 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                กล้าหาร
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-20">
          <div className={`max-w-4xl w-full text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-gray-600 bg-white rounded-full border border-gray-200 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              ใช้งานได้ฟรี ไม่ต้องสมัครสมาชิก
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              แบ่งบิลง่าย
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  ยุติธรรมทุกคน
                </span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-violet-300" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0 8 Q50 0 100 8 T200 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-500 mb-12 max-w-xl mx-auto leading-relaxed font-light">
              คำนวณค่าใช้จ่ายอย่างละเอียด ใครกินอะไรจ่ายแค่นั้น
              <br className="hidden sm:block" />
              ไม่ต้องเถียงกันอีกต่อไป
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => router.push('/create')}
                className="group relative w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gray-900/20"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  สร้างบิลใหม่
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>

              <button
                onClick={() => setShowBillModal(true)}
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-gray-700 bg-white rounded-2xl border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                ดูบิลที่มีอยู่
              </button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: '⚡', title: 'รวดเร็ว', desc: 'สร้างบิลได้ใน 1 นาที' },
                { icon: '🎯', title: 'แม่นยำ', desc: 'คำนวณละเอียดทุกรายการ' },
                { icon: '🔗', title: 'แชร์ง่าย', desc: 'ส่งลิงก์ให้เพื่อนได้เลย' },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className={`group p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-500 hover:-translate-y-1 ${
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${(i + 1) * 150}ms` }}
                >
                  <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Scroll indicator */}
            <div className="mt-16 animate-bounce">
              <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section
          ref={howItWorksRef}
          data-section="how-it-works"
          className="relative py-24 px-6 bg-gradient-to-b from-transparent to-gray-50/50"
        >
          <div className="max-w-4xl mx-auto">
            <div className={`text-center mb-16 transition-all duration-700 ${isVisible('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                ใช้งานง่ายใน 3 ขั้นตอน
              </h2>
              <p className="text-gray-500">ไม่ต้องโหลดแอป ไม่ต้องสมัครสมาชิก</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'สร้างบิล', desc: 'เพิ่มรายการอาหารและราคา', ref: step1Ref, id: 'step1', icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )},
                { step: '02', title: 'เชิญเพื่อน', desc: 'ส่งลิงก์ให้ทุกคนเลือกเมนู', ref: step2Ref, id: 'step2', icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                )},
                { step: '03', title: 'จบ!', desc: 'ระบบคำนวณยอดให้อัตโนมัติ', ref: step3Ref, id: 'step3', icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )},
              ].map((item, i) => (
                <div
                  key={item.step}
                  ref={item.ref}
                  data-section={item.id}
                  className={`relative transition-all duration-700 ${isVisible(item.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  {i < 2 && (
                    <div className={`hidden md:block absolute top-12 left-full w-full h-px z-0 transition-all duration-1000 delay-500 ${isVisible(item.id) ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} style={{ transformOrigin: 'left' }}>
                      <div className="h-full bg-gradient-to-r from-gray-300 to-transparent" />
                    </div>
                  )}
                  <div className="relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group hover:-translate-y-2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center group-hover:bg-violet-600 transition-colors duration-300 group-hover:scale-110 transform">
                        {item.icon}
                      </div>
                      <span className="text-5xl font-bold text-gray-100 group-hover:text-violet-100 transition-colors duration-300">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Admin Access */}
        <section
          ref={adminSectionRef}
          data-section="admin"
          className="py-16 px-6"
        >
          <div className={`max-w-2xl mx-auto transition-all duration-700 ${isVisible('admin') ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 sm:p-12 text-white group hover:shadow-2xl transition-shadow duration-500">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/10 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">สำหรับ Admin</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  เข้าถึงหน้าจัดการบิล แก้ไขรายการ และดูสรุปยอดทั้งหมด
                </p>
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
                >
                  เข้าหน้า Admin
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">กล้าหาร</span>
            </div>
            <p className="text-sm text-gray-400">
              พัฒนาโดย Mr. Peeradol Thanyatheeraphong
            </p>
          </div>
        </div>
      </footer>

      {/* Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBillModal(false)}
          />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-modal-in">
            <button
              onClick={() => setShowBillModal(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">ดูบิลที่มีอยู่</h3>
            <p className="text-gray-500 mb-6">กรอก Bill ID หรือลิงก์ของบิล</p>
            <input
              type="text"
              value={billIdInput}
              onChange={(e) => setBillIdInput(e.target.value)}
              placeholder="Bill ID หรือ URL"
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-violet-500 focus:outline-none transition-colors mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleViewBill()}
            />
            <button
              onClick={handleViewBill}
              disabled={!billIdInput}
              className="w-full py-4 text-lg font-semibold text-white bg-gray-900 rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              ดูบิล
            </button>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAdminModal(false)}
          />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-modal-in">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h3>
            <p className="text-gray-500 mb-6">กรอกข้อมูลเพื่อเข้าหน้าจัดการบิล</p>
            <div className="space-y-4">
              <input
                type="text"
                value={billIdInput}
                onChange={(e) => setBillIdInput(e.target.value)}
                placeholder="Bill ID หรือ URL"
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-violet-500 focus:outline-none transition-colors"
              />
              <input
                type="text"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                placeholder="รหัส Admin (6 ตัวอักษร)"
                maxLength={6}
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-violet-500 focus:outline-none transition-colors font-mono tracking-widest text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
              />
            </div>
            <button
              onClick={handleAdminAccess}
              disabled={!billIdInput || adminCode.length !== 6}
              className="w-full mt-6 py-4 text-lg font-semibold text-white bg-gray-900 rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              เข้าหน้า Admin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
