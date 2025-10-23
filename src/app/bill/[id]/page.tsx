'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBill } from '@/context/BillContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { calculateMemberSummaries, calculateTransactions, formatCurrency, generateId } from '@/lib/calculations';
import { ItemRequest, Comment } from '@/types';

export default function BillPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const { bills, loadBill, addRequest, addComment } = useBill();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestItemId, setRequestItemId] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<'add' | 'remove'>('remove');
  const [requestReason, setRequestReason] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');

  const bill = bills[billId];

  useEffect(() => {
    if (billId) {
      loadBill(billId);
    }
  }, [billId, loadBill]);

  // Handle request submission
  const handleSubmitRequest = async (itemId: string, type: 'add' | 'remove') => {
    if (!selectedMember || !bill) return;

    const member = bill.members.find((m) => m.id === selectedMember);
    const item = bill.items.find((i) => i.id === itemId);
    if (!member || !item) return;

    const request: ItemRequest = {
      id: generateId(),
      itemId: itemId,
      memberId: selectedMember,
      memberName: member.name,
      itemName: item.name,
      reason: requestReason.trim() || undefined,
      status: 'pending',
      createdAt: new Date(),
    };

    await addRequest(billId, request);
    setShowRequestModal(false);
    setRequestItemId(null);
    setRequestReason('');
    alert('ส่งคำขอแล้ว! รอ Admin ตรวจสอบ');
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!selectedMember || !commentText.trim() || !bill) return;

    const member = bill.members.find((m) => m.id === selectedMember);
    if (!member) return;

    const comment: Comment = {
      id: generateId(),
      memberId: selectedMember,
      memberName: member.name,
      message: commentText.trim(),
      createdAt: new Date(),
    };

    await addComment(billId, comment);
    setCommentText('');
    alert('ส่งความคิดเห็นแล้ว!');
  };

  if (!bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="text-center max-w-md w-full shadow-lg">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ไม่พบบิลนี้
          </h1>
          <p className="text-gray-600 mb-6">
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center mb-8 shadow-lg">
            <div className="mb-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {bill.name}
              </h1>
              <p className="text-gray-600 text-lg">เลือกชื่อของคุณเพื่อดูรายละเอียด</p>
            </div>
          </Card>

          <Card className="shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              สมาชิกทั้งหมด
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bill.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className="p-6 border-2 border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-gradient-to-br hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 transition-all text-left group shadow-sm hover:shadow-xl hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full group-hover:scale-110 transition-transform shadow-lg border-4 border-white"
                      style={{ backgroundColor: member.color }}
                    />
                    <span className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg"
                style={{ backgroundColor: member.color }}
              />
              <div>
                <h1 className="text-3xl font-bold">สวัสดี, {member.name}!</h1>
                <p className="text-indigo-100 text-lg">{bill.name}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedMember(null)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors font-semibold"
            >
              เปลี่ยนคน
            </button>
          </div>

          {memberSummary && (
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-indigo-100 mb-1">ยอดที่ต้องหาร</p>
                <p className="text-3xl font-bold">{formatCurrency(memberSummary.totalShared)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-indigo-100 mb-1">ยอดที่จ่ายไป</p>
                <p className="text-3xl font-bold">{formatCurrency(memberSummary.totalPaid)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-indigo-100 mb-1">ยอดสุทธิ</p>
                <p className={`text-3xl font-bold ${memberSummary.balance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {memberSummary.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(memberSummary.balance))}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Transactions */}
        {memberTransactions.length > 0 && (
          <Card className="shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                💸 รายการโอนเงิน
              </h2>
              <p className="text-gray-600">รายการที่คุณต้องจ่ายหรือรับ</p>
            </div>
            <div className="space-y-4">
              {memberTransactions.map((transaction, index) => {
                const isReceiver = transaction.to === selectedMember;
                return (
                  <div
                    key={index}
                    className={`p-5 rounded-2xl border-2 shadow-md ${
                      isReceiver
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300'
                        : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300'
                    }`}
                  >
                    {isReceiver ? (
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 mb-1">
                          คุณจะได้รับเงินจาก
                        </p>
                        <p className="text-xl font-bold text-gray-900 mb-2">
                          {transaction.fromName}
                        </p>
                        <p className="text-3xl font-bold text-emerald-600">
                          +{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-red-700 mb-1">
                          คุณต้องจ่ายเงินให้
                        </p>
                        <p className="text-xl font-bold text-gray-900 mb-2">
                          {transaction.toName}
                        </p>
                        <p className="text-3xl font-bold text-red-600">
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
          <Card className="shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                💰 ช่องทางการโอนเงิน
              </h2>
              <p className="text-gray-600">โอนเงินตามช่องทางด้านล่าง</p>
            </div>
            <div className="space-y-4">
              {bill.paymentMethods.map((method, index) => (
                <div key={index} className="p-6 bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-xl transition-all">
                  {method.type === 'promptpay' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white text-2xl shadow-lg">
                          💳
                        </div>
                        <div className="flex-1">
                          <Badge variant="info" size="lg">พร้อมเพย์</Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-1">เบอร์โทรศัพท์</p>
                          <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                            {method.phoneNumber}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700">เจ้าของบัญชี: <span className="text-indigo-600">{method.ownerName}</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                  {method.type === 'qrcode' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg">
                          📱
                        </div>
                        <div className="flex-1">
                          <Badge variant="success" size="lg">QR Code</Badge>
                        </div>
                      </div>
                      <a
                        href={method.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-4 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all text-center font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        📷 ดู QR Code
                      </a>
                      <div className="pt-4 mt-4 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700">เจ้าของบัญชี: <span className="text-emerald-600">{method.ownerName}</span></p>
                      </div>
                    </div>
                  )}
                  {method.type === 'bank' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg">
                          🏦
                        </div>
                        <div className="flex-1">
                          <Badge variant="warning" size="lg">บัญชีธนาคาร</Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-1">ธนาคาร</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {method.bankName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-1">เลขบัญชี</p>
                          <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                            {method.accountNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-1">ชื่อบัญชี</p>
                          <p className="text-xl font-bold text-gray-900">
                            {method.accountName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Items */}
        <Card className="shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              🍽️ รายการที่คุณหาร
            </h2>
            <p className="text-gray-600">รายการทั้งหมดที่คุณต้องจ่าย</p>
          </div>
          <div className="space-y-3">
            {memberItems.map((item) => {
              const shareAmount = item.price / item.sharedBy.length;
              const hasPendingRequest = bill.requests.some(
                (req) => req.itemId === item.id && req.memberId === selectedMember && req.status === 'pending'
              );
              return (
                <div
                  key={item.id}
                  className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        หาร {item.sharedBy.length} คน
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        ราคารวม {formatCurrency(item.price)}
                      </p>
                      <p className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        คุณ: {formatCurrency(shareAmount)}
                      </p>
                    </div>
                  </div>
                  {hasPendingRequest ? (
                    <div className="pt-3 border-t border-gray-200">
                      <Badge variant="warning">รอ Admin ตรวจสอบคำขอ</Badge>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setRequestItemId(item.id);
                          setRequestType('remove');
                          setShowRequestModal(true);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-semibold hover:underline"
                      >
                        🚫 ขอไม่หารเมนูนี้
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {memberItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-lg">ไม่มีรายการที่คุณต้องหาร</p>
              </div>
            )}
          </div>
        </Card>

        {/* Comments Section */}
        <Card className="shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💬 ความคิดเห็น
          </h2>

          {/* Show member's comments */}
          <div className="space-y-4 mb-6">
            {bill.comments
              .filter((comment) => comment.memberId === selectedMember)
              .map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200"
                >
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      {new Date(comment.createdAt).toLocaleString('th-TH')}
                    </p>
                    <p className="text-gray-900 mt-2">{comment.message}</p>
                  </div>
                  {comment.adminReply && (
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <p className="text-sm font-semibold text-indigo-600 mb-1">
                        ตอบกลับจาก Admin:
                      </p>
                      <p className="text-gray-900">{comment.adminReply}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Add comment form */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เขียนความคิดเห็น
              </label>
              <textarea
                placeholder="พิมพ์ข้อความถึง Admin..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 shadow-sm resize-none"
              />
            </div>
            <Button
              fullWidth
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
            >
              ส่งความคิดเห็น
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <Card className="shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
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

      {/* Request Modal */}
      {showRequestModal && requestItemId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ส่งคำขอไม่หารเมนู
            </h3>
            <p className="text-gray-600 mb-6">
              คุณกำลังขอไม่หารเมนู "{bill.items.find((i) => i.id === requestItemId)?.name}"
              <br />
              คำขอจะถูกส่งไปยัง Admin เพื่อพิจารณา
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เหตุผล (ไม่บังคับ)
              </label>
              <textarea
                placeholder="เช่น ไม่ได้กินเมนูนี้, กินเมนูอื่นแทน..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 shadow-sm resize-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestItemId(null);
                  setRequestReason('');
                }}
              >
                ยกเลิก
              </Button>
              <Button
                fullWidth
                onClick={() => handleSubmitRequest(requestItemId, requestType)}
              >
                ส่งคำขอ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
