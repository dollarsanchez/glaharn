'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useBill } from '@/context/BillContext';
import { generateAdminCode } from '@/lib/calculations';

export default function CreateBillPage() {
  const router = useRouter();
  const { createBill } = useBill();

  // Form state
  const [billName, setBillName] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBill = async () => {
    if (!billName.trim()) {
      alert('กรุณากรอกชื่อบิล');
      return;
    }

    setIsCreating(true);

    try {
      const adminId = generateAdminCode();

      // Combine date and time if provided
      let fullEventDate: Date | undefined;
      if (eventDate) {
        if (eventTime) {
          fullEventDate = new Date(`${eventDate}T${eventTime}`);
        } else {
          fullEventDate = new Date(eventDate);
        }
      }

      const bill = await createBill(
        billName.trim(),
        adminId,
        location.trim() || undefined,
        fullEventDate
      );

      // Navigate to admin dashboard
      router.push(`/bill/${bill.id}/admin?code=${adminId}`);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('เกิดข้อผิดพลาดในการสร้างบิล กรุณาลองใหม่อีกครั้ง');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            สร้างบิลใหม่
          </h1>
          <p className="text-gray-600 text-lg">กรอกข้อมูลพื้นฐานเพื่อเริ่มต้น</p>
        </div>

        {/* Form Card */}
        <Card className="mb-8 shadow-lg">
          <div className="space-y-6">
            <div>
              <Input
                label="ชื่อบิล / ชื่องาน"
                placeholder="เช่น งานเลี้ยงวันเกิด, ทานข้าวกลุ่ม, ปาร์ตี้สังสรรค์"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <Input
                label="สถานที่ (ไม่บังคับ)"
                placeholder="เช่น ร้านอาหารกลางเมือง, บ้านเพื่อน"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="วันที่ (ไม่บังคับ)"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="เวลา (ไม่บังคับ)"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleCreateBill}
                size="lg"
                fullWidth
                disabled={isCreating || !billName.trim()}
              >
                {isCreating ? 'กำลังสร้างบิล...' : 'สร้างบิลและไปหน้าจัดการ'}
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <p className="font-semibold text-indigo-900 mb-1">คุณจะได้รับ:</p>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• รหัส Admin 6 ตัวอักษรสำหรับจัดการบิล</li>
                    <li>• หน้าจัดการสำหรับเพิ่มสมาชิกและรายการอาหาร</li>
                    <li>• ลิงก์สำหรับแชร์ให้เพื่อนๆ ดูยอดเงิน</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Back button */}
        <div className="text-center">
          <Button
            variant="secondary"
            onClick={() => router.push('/')}
          >
            ← กลับหน้าหลัก
          </Button>
        </div>
      </div>
    </div>
  );
}
