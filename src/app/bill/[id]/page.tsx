'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBill } from '@/context/BillContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { calculateMemberSummaries, calculateTransactions, formatCurrency, generateId } from '@/lib/calculations';
import { ItemRequest, Comment, PaymentMethodRequest } from '@/types';
import { uploadQRCode, validateImageFile } from '@/lib/storage';
import { useToast } from '@/components/ui/Toast';

export default function BillPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const { bills, loadBill, addRequest, addComment, addPaymentMethodRequest } = useBill();
  const { showToast } = useToast();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestItemId, setRequestItemId] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<'add' | 'remove'>('remove');
  const [requestReason, setRequestReason] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');

  // Payment method modal state (for members to add their own)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'promptpay' | 'qrcode' | 'bank'>('promptpay');
  const [promptPayPhone, setPromptPayPhone] = useState('');
  const [qrcodeFile, setQrcodeFile] = useState<File | null>(null);
  const [qrcodePreview, setQrcodePreview] = useState<string>('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
    showToast('ส่งคำขอแล้ว! รอ Admin ตรวจสอบ', 'success');
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
    showToast('ส่งความคิดเห็นแล้ว!', 'success');
  };

  // Handle file selection for QR Code
  const handleQRFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      setQrcodeFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrcodePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      showToast(error.message, 'error');
      e.target.value = '';
    }
  };

  // Handle adding payment method (by member) - ส่ง request ให้ admin อนุมัติ
  const handleAddPaymentMethod = async () => {
    if (!selectedMember || !bill) return;

    const member = bill.members.find((m) => m.id === selectedMember);
    if (!member) return;

    setIsUploading(true);
    let newMethod: any = null;

    try {
      if (paymentType === 'promptpay' && promptPayPhone.trim()) {
        newMethod = {
          type: 'promptpay',
          phoneNumber: promptPayPhone.trim(),
          ownerId: selectedMember,
          ownerName: member.name,
        };
      } else if (paymentType === 'qrcode' && qrcodeFile) {
        // Upload QR Code image to Supabase Storage
        const imageUrl = await uploadQRCode(qrcodeFile, billId);
        newMethod = {
          type: 'qrcode',
          imageUrl: imageUrl,
          ownerId: selectedMember,
          ownerName: member.name,
        };
      } else if (paymentType === 'bank' && bankName.trim() && accountNumber.trim() && accountName.trim()) {
        newMethod = {
          type: 'bank',
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          ownerId: selectedMember,
          ownerName: member.name,
        };
      } else {
        showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
        setIsUploading(false);
        return;
      }

      // สร้าง Payment Method Request แทนการเพิ่มโดยตรง
      const request: PaymentMethodRequest = {
        id: generateId(),
        memberId: selectedMember,
        memberName: member.name,
        requestType: 'add',
        paymentMethod: newMethod,
        status: 'pending',
        createdAt: new Date(),
      };

      await addPaymentMethodRequest(billId, request);
      setShowAddPaymentModal(false);
      setPromptPayPhone('');
      setQrcodeFile(null);
      setQrcodePreview('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      showToast('ส่งคำขอเพิ่มช่องทางรับเงินแล้ว! รอ Admin อนุมัติ', 'success');
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      showToast(error.message || 'เกิดข้อผิดพลาดในการเพิ่มช่องทางรับเงิน', 'error');
    } finally {
      setIsUploading(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-10"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-3xl opacity-10"></div>
        </div>

        <div className="max-w-3xl mx-auto relative">
          {/* Header Card */}
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl p-8 mb-8 shadow-2xl border border-white/20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 mb-4">
              <span className="text-2xl">💰</span>
              <span className="text-sm font-semibold text-indigo-700">กล้าหาร</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              {bill.name}
            </h1>
            {bill.location && (
              <p className="text-gray-600 text-lg flex items-center justify-center gap-2">
                <span>📍</span>
                <span>{bill.location}</span>
              </p>
            )}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xl text-gray-700 font-semibold mb-2">เลือกชื่อของคุณเพื่อดูรายละเอียด</p>
              <p className="text-gray-500">คลิกที่ชื่อของคุณด้านล่าง</p>
            </div>
          </div>

          {/* Members Grid */}
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>👥</span>
              <span>สมาชิกทั้งหมด ({bill.members.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bill.members.map((member, index) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className="group relative p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 text-left overflow-hidden hover:scale-105"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Gradient Border on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ padding: '2px' }}>
                    <div className="h-full w-full bg-white rounded-2xl"></div>
                  </div>

                  <div className="relative flex items-center gap-4">
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-full group-hover:scale-110 transition-transform shadow-lg"
                        style={{ backgroundColor: member.color }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs flex items-center justify-center">✓</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-xl font-bold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                        {member.name}
                      </span>
                      <p className="text-sm text-gray-500 group-hover:text-gray-700">คลิกเพื่อดูยอด</p>
                    </div>
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="backdrop-blur-sm bg-white/50 hover:bg-white/70 shadow-lg"
            >
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 relative">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/30 shadow-2xl flex-shrink-0 ring-4 ring-white/10"
                    style={{ backgroundColor: member.color }}
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl">👋</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">สวัสดี, {member.name}!</h1>
                  <p className="text-white/90 text-lg font-semibold">{bill.name}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/80">
                    {bill.location && (
                      <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                        <span>📍</span>
                        <span>{bill.location}</span>
                      </span>
                    )}
                    {bill.eventDate && (
                      <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                        <span>📅</span>
                        <span>{new Date(bill.eventDate).toLocaleDateString('th-TH', {
                          month: 'short',
                          day: 'numeric',
                        })}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl transition-all font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105"
              >
                🔄 เปลี่ยนคน
              </button>
            </div>

            {memberSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/20">
                <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-5 border border-white/30 hover:bg-white/30 transition-all duration-300 group">
                  <p className="text-sm text-white/80 mb-2 font-medium">💰 ยอดที่ต้องหาร</p>
                  <p className="text-3xl sm:text-4xl font-bold text-white group-hover:scale-110 transition-transform">{formatCurrency(memberSummary.totalShared)}</p>
                </div>
                <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-5 border border-white/30 hover:bg-white/30 transition-all duration-300 group">
                  <p className="text-sm text-white/80 mb-2 font-medium">💳 ยอดที่จ่ายไป</p>
                  <p className="text-3xl sm:text-4xl font-bold text-white group-hover:scale-110 transition-transform">{formatCurrency(memberSummary.totalPaid)}</p>
                </div>
                <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-5 border border-white/30 hover:bg-white/30 transition-all duration-300 group">
                  <p className="text-sm text-white/80 mb-2 font-medium">
                    {memberSummary.balance >= 0 ? '✅ ยอดสุทธิ' : '⚠️ ยอดสุทธิ'}
                  </p>
                  <p className={`text-3xl sm:text-4xl font-bold group-hover:scale-110 transition-transform ${
                    memberSummary.balance >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    {memberSummary.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(memberSummary.balance))}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions */}
        {memberTransactions.length > 0 && (
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <span>💸</span>
                <span>รายการโอนเงิน</span>
              </h2>
              <p className="text-gray-600 mt-1">รายการที่คุณต้องจ่ายหรือรับ</p>
            </div>
            <div className="space-y-4">
              {memberTransactions.map((transaction, index) => {
                const isReceiver = transaction.to === selectedMember;
                return (
                  <div
                    key={index}
                    className={`relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${
                      isReceiver
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-br from-rose-500 to-pink-500'
                    }`}
                  >
                    {/* Decorative Pattern */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

                    <div className="relative">
                      {isReceiver ? (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                              <span className="text-xl">📥</span>
                              <p className="text-sm font-semibold text-white">
                                คุณจะได้รับเงินจาก
                              </p>
                            </div>
                            <p className="text-2xl font-bold text-white mb-2">
                              {transaction.fromName}
                            </p>
                            <p className="text-4xl font-bold text-white">
                              +{formatCurrency(transaction.amount)}
                            </p>
                          </div>
                          <div className="text-5xl opacity-20">✅</div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                              <span className="text-xl">📤</span>
                              <p className="text-sm font-semibold text-white">
                                คุณต้องจ่ายเงินให้
                              </p>
                            </div>
                            <p className="text-2xl font-bold text-white mb-2">
                              {transaction.toName}
                            </p>
                            <p className="text-4xl font-bold text-white">
                              -{formatCurrency(transaction.amount)}
                            </p>
                          </div>
                          <div className="text-5xl opacity-20">⚠️</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Member's Payment Methods (for receiving money) */}
        {memberSummary && memberSummary.balance > 0 && (
          <Card className="shadow-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                💰 ช่องทางรับเงินของคุณ
              </h2>
              <p className="text-emerald-700 font-semibold">
                คุณจะได้รับเงิน {formatCurrency(memberSummary.balance)} - เพิ่มช่องทางรับเงินเพื่อให้เพื่อนโอนได้!
              </p>
            </div>

            {/* Display existing payment methods for this member */}
            <div className="space-y-3 mb-4">
              {bill.paymentMethods
                .filter((method) => method.ownerId === selectedMember)
                .map((method, index) => (
                  <div key={index} className="p-4 bg-white rounded-xl border border-emerald-300 shadow-sm">
                    {method.type === 'promptpay' && (
                      <div>
                        <Badge variant="info" size="lg">พร้อมเพย์</Badge>
                        <p className="text-2xl font-mono font-bold text-gray-900 mt-2">
                          {method.phoneNumber}
                        </p>
                      </div>
                    )}
                    {method.type === 'qrcode' && (
                      <div>
                        <Badge variant="success" size="lg">QR Code</Badge>
                        <a
                          href={method.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-2 text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                        >
                          📷 ดู QR Code
                        </a>
                      </div>
                    )}
                    {method.type === 'bank' && (
                      <div>
                        <Badge variant="warning" size="lg">บัญชีธนาคาร</Badge>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          {method.bankName}
                        </p>
                        <p className="text-lg font-mono text-gray-900">
                          {method.accountNumber}
                        </p>
                        <p className="text-sm text-gray-700">
                          {method.accountName}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <Button
              fullWidth
              onClick={() => setShowAddPaymentModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              ➕ เพิ่มช่องทางรับเงิน
            </Button>
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
                showToast('คัดลอกลิงก์แล้ว!', 'success');
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

      {/* Add Payment Method Modal (for members) */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              เพิ่มช่องทางรับเงิน
            </h3>
            <p className="text-gray-600 mb-6">
              เพิ่มช่องทางของคุณเพื่อให้เพื่อนๆ โอนเงินมาได้
            </p>

            {/* Payment type selector */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={paymentType === 'promptpay' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setPaymentType('promptpay')}
                className="flex-1"
              >
                พร้อมเพย์
              </Button>
              <Button
                variant={paymentType === 'qrcode' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setPaymentType('qrcode')}
                className="flex-1"
              >
                QR Code
              </Button>
              <Button
                variant={paymentType === 'bank' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setPaymentType('bank')}
                className="flex-1"
              >
                บัญชีธนาคาร
              </Button>
            </div>

            {/* Form fields based on payment type */}
            <div className="space-y-4">
              {paymentType === 'promptpay' && (
                <Input
                  label="เบอร์โทรศัพท์พร้อมเพย์"
                  placeholder="0812345678"
                  value={promptPayPhone}
                  onChange={(e) => setPromptPayPhone(e.target.value)}
                  autoFocus
                />
              )}

              {paymentType === 'qrcode' && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-900">
                    อัพโหลดรูป QR Code
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleQRFileChange}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-xl cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500">
                    รองรับ JPG, PNG, WEBP (ขนาดไม่เกิน 5MB)
                  </p>
                  {qrcodePreview && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">ตัวอย่าง:</p>
                      <img
                        src={qrcodePreview}
                        alt="QR Code Preview"
                        className="w-48 h-48 object-contain border-2 border-gray-200 rounded-xl"
                      />
                    </div>
                  )}
                </div>
              )}

              {paymentType === 'bank' && (
                <>
                  <Input
                    label="ชื่อธนาคาร"
                    placeholder="เช่น ธนาคารกสิกรไทย"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    autoFocus
                  />
                  <Input
                    label="เลขบัญชี"
                    placeholder="123-4-56789-0"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <Input
                    label="ชื่อบัญชี"
                    placeholder="นาย สมชาย ใจดี"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setPromptPayPhone('');
                  setQrcodeFile(null);
                  setQrcodePreview('');
                  setBankName('');
                  setAccountNumber('');
                  setAccountName('');
                }}
                disabled={isUploading}
              >
                ยกเลิก
              </Button>
              <Button
                fullWidth
                onClick={handleAddPaymentMethod}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isUploading}
              >
                {isUploading ? 'กำลังอัพโหลด...' : 'ส่งคำขอ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
