'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBill } from '@/context/BillContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { calculateMemberSummaries, calculateTransactions, formatCurrency } from '@/lib/calculations';

export default function BillPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const { bills, loadBill } = useBill();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const bill = bills[billId];

  useEffect(() => {
    if (billId) {
      loadBill(billId);
    }
  }, [billId, loadBill]);

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="text-center max-w-md w-full">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ไม่พบบิลนี้
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            กรุณาตรวจสอบลิงก์ว่าถูกต้องหรือไม่
          </p>
          <Button onClick={() => router.push('/')}>กลับหน้าหลัก</Button>
        </Card>
      </div>
    );
  }

  // If no member selected, show member selection
  if (!selectedMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {bill.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">เลือกชื่อของคุณเพื่อดูรายละเอียด</p>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              สมาชิกทั้งหมด
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bill.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: member.color }}
                    />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {member.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => router.push('/')}>
              ← กลับหน้าหลัก
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show member's summary
  const member = bill.members.find((m) => m.id === selectedMember);
  if (!member) return null;

  const summaries = calculateMemberSummaries(bill);
  const transactions = calculateTransactions(summaries);
  const memberSummary = summaries.find((s) => s.memberId === selectedMember);

  const memberItems = bill.items.filter((item) => item.sharedBy.includes(selectedMember));
  const memberTransactions = transactions.filter(
    (t) => t.from === selectedMember || t.to === selectedMember
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-br from-violet-600 to-indigo-700 border-none text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-full border-4 border-white/30"
                style={{ backgroundColor: member.color }}
              />
              <div>
                <h1 className="text-2xl font-bold">สวัสดี, {member.name}!</h1>
                <p className="text-violet-100">{bill.name}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedMember(null)}
              className="text-white/80 hover:text-white"
            >
              เปลี่ยนคน
            </button>
          </div>

          {memberSummary && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-sm text-violet-200">ยอดที่ต้องหาร</p>
                <p className="text-2xl font-bold">{formatCurrency(memberSummary.totalShared)}</p>
              </div>
              <div>
                <p className="text-sm text-violet-200">ยอดที่จ่ายไป</p>
                <p className="text-2xl font-bold">{formatCurrency(memberSummary.totalPaid)}</p>
              </div>
              <div>
                <p className="text-sm text-violet-200">ยอดสุทธิ</p>
                <p className={`text-2xl font-bold ${memberSummary.balance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {memberSummary.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(memberSummary.balance))}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Transactions */}
        {memberTransactions.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              💸 รายการโอนเงิน
            </h2>
            <div className="space-y-3">
              {memberTransactions.map((transaction, index) => {
                const isReceiver = transaction.to === selectedMember;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      isReceiver
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    }`}
                  >
                    {isReceiver ? (
                      <div>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                          คุณจะได้รับเงินจาก
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {transaction.fromName}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                          คุณต้องจ่ายเงินให้
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {transaction.toName}
                        </p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          -{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Payment Methods */}
        {bill.paymentMethods.length > 0 && memberSummary && memberSummary.balance < 0 && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              💰 ช่องทางการโอนเงิน
            </h2>
            <div className="space-y-3">
              {bill.paymentMethods.map((method, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  {method.type === 'promptpay' && (
                    <div>
                      <Badge variant="info">พร้อมเพย์</Badge>
                      <p className="mt-2 text-lg font-mono text-gray-900 dark:text-white">
                        {method.phoneNumber}
                      </p>
                    </div>
                  )}
                  {method.type === 'qrcode' && (
                    <div>
                      <Badge variant="success">QR Code</Badge>
                      <a
                        href={method.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        ดู QR Code
                      </a>
                    </div>
                  )}
                  {method.type === 'bank' && (
                    <div>
                      <Badge variant="warning">บัญชีธนาคาร</Badge>
                      <div className="mt-2 space-y-1">
                        <p className="text-gray-900 dark:text-white font-semibold">
                          {method.bankName}
                        </p>
                        <p className="text-lg font-mono text-gray-900 dark:text-white">
                          {method.accountNumber}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {method.accountName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Items */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🍽️ รายการที่คุณหาร ({memberItems.length})
          </h2>
          <div className="space-y-2">
            {memberItems.map((item) => {
              const shareAmount = item.price / item.sharedBy.length;
              return (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      หาร {item.sharedBy.length} คน
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ราคารวม {formatCurrency(item.price)}
                    </p>
                    <p className="font-bold text-violet-600 dark:text-violet-400">
                      คุณ: {formatCurrency(shareAmount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Actions */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            ⚙️ การจัดการ
          </h2>
          <div className="space-y-3">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => {
                const link = window.location.href;
                navigator.clipboard.writeText(link);
                alert('คัดลอกลิงก์แล้ว!');
              }}
            >
              📋 คัดลอกลิงก์
            </Button>
            <Button
              fullWidth
              variant="ghost"
              onClick={() => setSelectedMember(null)}
            >
              🔄 เปลี่ยนสมาชิก
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
