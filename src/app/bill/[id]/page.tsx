'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBill } from '@/context/BillContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { calculateMemberSummaries, calculateTransactions, formatCurrency, generateId } from '@/lib/calculations';
import { ItemRequest, Comment, PaymentMethodRequest, PaymentMethod } from '@/types';
import { uploadQRCode, validateImageFile } from '@/lib/storage';
import { useToast } from '@/components/ui/Toast';

export default function BillPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const { bills, loadBill, addRequest, addComment, addPaymentMethodRequest, updateMember } = useBill();
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

  // Payment slip upload state
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>('');
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  // Search state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

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

    const validationError = validateImageFile(file);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    setQrcodeFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrcodePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle payment method request submission
  const handleSubmitPaymentRequest = async () => {
    if (!selectedMember || !bill) return;

    const member = bill.members.find((m) => m.id === selectedMember);
    if (!member) return;

    setIsUploading(true);

    try {
      let paymentMethod: PaymentMethod;

      if (paymentType === 'promptpay') {
        if (!promptPayPhone) {
          showToast('กรุณากรอกเบอร์โทรศัพท์', 'error');
          setIsUploading(false);
          return;
        }
        paymentMethod = {
          type: 'promptpay',
          phoneNumber: promptPayPhone,
          ownerId: selectedMember,
          ownerName: member.name,
        };
      } else if (paymentType === 'qrcode') {
        if (!qrcodeFile) {
          showToast('กรุณาเลือกไฟล์ QR Code', 'error');
          setIsUploading(false);
          return;
        }

        try {
          const imageUrl = await uploadQRCode(qrcodeFile, billId);
          if (!imageUrl) {
            throw new Error('ไม่สามารถอัพโหลดรูปภาพได้');
          }
          paymentMethod = {
            type: 'qrcode',
            imageUrl,
            ownerId: selectedMember,
            ownerName: member.name,
          };
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          showToast(`ไม่สามารถอัพโหลด QR Code: ${uploadError.message}`, 'error');
          setIsUploading(false);
          return;
        }
      } else {
        if (!bankName || !accountNumber || !accountName) {
          showToast('กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน', 'error');
          setIsUploading(false);
          return;
        }
        paymentMethod = {
          type: 'bank',
          bankName,
          accountNumber,
          accountName,
          ownerId: selectedMember,
          ownerName: member.name,
        };
      }

      const paymentRequest: PaymentMethodRequest = {
        id: generateId(),
        memberId: selectedMember,
        memberName: member.name,
        requestType: 'add',
        paymentMethod,
        status: 'pending',
        createdAt: new Date(),
      };

      await addPaymentMethodRequest(billId, paymentRequest);
      setShowAddPaymentModal(false);
      setPromptPayPhone('');
      setQrcodeFile(null);
      setQrcodePreview('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      showToast('ส่งคำขอเพิ่มช่องทางรับเงินแล้ว! รอ Admin อนุมัติ', 'success');
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการส่งคำขอ', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle slip file selection
  const handleSlipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    setSlipFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSlipPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle slip upload
  const handleUploadSlip = async () => {
    if (!slipFile || !selectedMember || !bill) return;

    const member = bill.members.find((m) => m.id === selectedMember);
    if (!member) return;

    try {
      setIsUploadingSlip(true);
      const slipUrl = await uploadQRCode(slipFile, billId);
      await updateMember(billId, selectedMember, { paymentSlipUrl: slipUrl });
      setSlipFile(null);
      setSlipPreview('');
      showToast('อัปโหลดสลิปสำเร็จ!', 'success');
    } catch (error) {
      console.error('Error uploading slip:', error);
      showToast('เกิดข้อผิดพลาดในการอัปโหลดสลิป', 'error');
    } finally {
      setIsUploadingSlip(false);
    }
  };

  // Handle slip removal
  const handleRemoveSlip = async () => {
    if (!selectedMember || !bill) return;

    try {
      await updateMember(billId, selectedMember, { paymentSlipUrl: undefined });
      showToast('ลบสลิปแล้ว', 'success');
    } catch (error) {
      console.error('Error removing slip:', error);
      showToast('เกิดข้อผิดพลาดในการลบสลิป', 'error');
    }
  };

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบบิล</h2>
          <p className="text-gray-600 mb-6">ไม่พบข้อมูลบิลที่คุณต้องการ</p>
          <Button onClick={() => router.push('/')}>กลับหน้าหลัก</Button>
        </Card>
      </div>
    );
  }

  // If no member selected, show member selection
  if (!selectedMember) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{bill.name}</h1>
            </div>
            {bill.location && (
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                <span>📍</span>
                <span>{bill.location}</span>
              </div>
            )}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">เลือกชื่อของคุณ</h2>
              <p className="text-gray-500">เพื่อดูรายละเอียดการแบ่งบิล</p>
            </div>
          </Card>

          {/* Members */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">สมาชิกทั้งหมด ({bill.members.length} คน)</h2>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาสมาชิก..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-11 pr-10 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-900 text-gray-900 font-medium"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                  🔍
                </span>
                {memberSearchQuery && (
                  <button
                    onClick={() => setMemberSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bill.members
                .filter((member) =>
                  memberSearchQuery.trim() === '' ||
                  member.name.toLowerCase().includes(memberSearchQuery.toLowerCase().trim())
                )
                .map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className="group p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: member.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                      <p className="text-sm text-gray-500">คลิกเพื่อดูยอด</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="text-center">
            <Button variant="secondary" onClick={() => router.push('/')}>
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
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Member Info */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-100 p-6 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full border-4 border-white shadow-sm"
                  style={{ backgroundColor: member.color }}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">สวัสดี, {member.name}</h1>
                  <p className="text-gray-600">{bill.name}</p>
                  {bill.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <span>📍</span>
                      <span>{bill.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedMember(null)}
              >
                เปลี่ยนคน
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {memberSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-700 font-medium mb-1">ยอดที่ต้องหาร</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(memberSummary.totalShared)}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm text-purple-700 font-medium mb-1">ยอดที่จ่ายไป</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(memberSummary.totalPaid)}</p>
              </div>
              <div className={`rounded-xl p-4 border ${
                memberSummary.balance >= 0
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-rose-50 border-rose-100'
              }`}>
                <p className={`text-sm font-medium mb-1 ${
                  memberSummary.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  ยอดสุทธิ
                </p>
                <p className={`text-2xl font-bold ${
                  memberSummary.balance >= 0 ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {memberSummary.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(memberSummary.balance))}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* 1. Items */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-1">รายการที่คุณหาร</h2>
          <p className="text-gray-500 text-sm mb-4">รายการทั้งหมดที่คุณต้องจ่าย</p>

          {/* Opt-out deadline notice */}
          {bill.optOutDeadline && (
            <div className={`mb-4 p-3 rounded-lg border ${
              new Date(bill.optOutDeadline) > new Date()
                ? 'bg-blue-50 border-blue-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {new Date(bill.optOutDeadline) > new Date() ? '⏰' : '🚫'}
                </span>
                <div className="flex-1">
                  {new Date(bill.optOutDeadline) > new Date() ? (
                    <>
                      <p className="font-semibold text-blue-900 text-sm">
                        มีกำหนดเวลาปิดรับคำขอไม่หาร
                      </p>
                      <p className="text-sm text-blue-700">
                        จนถึง {new Date(bill.optOutDeadline).toLocaleString('th-TH', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-red-900 text-sm">
                        ปิดรับคำขอไม่หารแล้ว
                      </p>
                      <p className="text-sm text-red-700">
                        หมดเวลาเมื่อ {new Date(bill.optOutDeadline).toLocaleString('th-TH', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {memberItems.map((item) => {
              const shareAmount = item.price / item.sharedBy.length;
              const hasPendingRequest = bill.requests.some(
                (req) => req.itemId === item.id && req.memberId === selectedMember && req.status === 'pending'
              );
              const isOptOutDeadlinePassed = bill.optOutDeadline && new Date(bill.optOutDeadline) <= new Date();

              // Get names of members who share this item
              const sharedByNames = item.sharedBy
                .map(id => bill.members.find(m => m.id === id)?.name)
                .filter(Boolean);

              return (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500 mb-1">
                        ราคารวม {formatCurrency(item.price)}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-gray-600">หารกับ:</span>
                        {sharedByNames.map((name, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              name === member.name
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">คุณจ่าย</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {formatCurrency(shareAmount)}
                      </p>
                    </div>
                  </div>
                  {hasPendingRequest ? (
                    <div className="pt-3 border-t border-gray-200">
                      <Badge variant="warning">รอ Admin ตรวจสอบคำขอ</Badge>
                    </div>
                  ) : isOptOutDeadlinePassed ? (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-400">
                        ⏱️ หมดเวลากดไม่หารแล้ว
                      </p>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setRequestItemId(item.id);
                          setRequestType('remove');
                          setShowRequestModal(true);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
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
                <p className="text-gray-400">ไม่มีรายการที่คุณต้องหาร</p>
              </div>
            )}
          </div>
        </Card>

        {/* 2. Transactions */}
        {memberTransactions.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-1">รายการโอนเงิน</h2>
            <p className="text-gray-500 text-sm mb-4">รายการที่คุณต้องจ่ายหรือรับ</p>

            <div className="space-y-3">
              {memberTransactions.map((transaction, index) => {
                const isReceiver = transaction.to === selectedMember;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      isReceiver
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-rose-50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          isReceiver ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isReceiver ? '📥 คุณจะได้รับเงินจาก' : '📤 คุณต้องจ่ายเงินให้'}
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {isReceiver ? transaction.fromName : transaction.toName}
                        </p>
                      </div>
                      <p className={`text-2xl font-bold ${
                        isReceiver ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isReceiver ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 3. Payment Methods for Paying */}
        {memberSummary && memberSummary.balance < 0 && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-1">ช่องทางการโอนเงิน</h2>
            <p className="text-gray-500 text-sm mb-4">โอนเงินตามช่องทางด้านล่าง</p>

            {/* Check if deadline has passed */}
            {bill.optOutDeadline && new Date(bill.optOutDeadline) > new Date() ? (
              // Show notice while deadline is still active
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⏰</span>
                  <div className="flex-1">
                    <p className="font-bold text-blue-900 text-lg mb-2">
                      ยังไม่ถึงเวลาชำระเงิน
                    </p>
                    <p className="text-blue-700 mb-3">
                      ช่องทางการชำระเงินจะเปิดให้ใช้งานหลังจากปิดรับคำขอไม่หาร
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-blue-300">
                      <p className="text-sm text-blue-800">
                        📅 ช่องทางชำระเงินจะแสดงหลังจาก:{' '}
                        <span className="font-semibold">
                          {new Date(bill.optOutDeadline).toLocaleString('th-TH', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Show payment methods after deadline
              bill.paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {bill.paymentMethods.map((method, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      {method.type === 'promptpay' && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="info">พร้อมเพย์</Badge>
                            <p className="text-sm text-gray-600">เจ้าของ: {method.ownerName}</p>
                          </div>
                          <p className="text-2xl font-mono font-bold text-gray-900">
                            {method.phoneNumber}
                          </p>
                        </div>
                      )}
                      {method.type === 'qrcode' && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="success">QR Code</Badge>
                            <p className="text-sm text-gray-600">เจ้าของ: {method.ownerName}</p>
                          </div>
                          <a
                            href={method.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
                          >
                            📷 ดู QR Code
                          </a>
                        </div>
                      )}
                      {method.type === 'bank' && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="warning">บัญชีธนาคาร</Badge>
                            <p className="text-sm text-gray-600">เจ้าของ: {method.ownerName}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-gray-900">{method.bankName}</p>
                            <p className="text-xl font-mono font-bold text-gray-900">{method.accountNumber}</p>
                            <p className="text-gray-700">{method.accountName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-gray-500">ยังไม่มีช่องทางการชำระเงิน</p>
                  <p className="text-gray-400 text-sm mt-1">รอ Admin เพิ่มช่องทางการรับเงิน</p>
                </div>
              )
            )}
          </Card>
        )}

        {/* Payment Methods for Receiving */}
        {memberSummary && memberSummary.balance > 0 && (
          <Card className="bg-emerald-50 border-emerald-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">ช่องทางรับเงินของคุณ</h2>
            <p className="text-emerald-700 text-sm mb-4">
              คุณจะได้รับเงิน {formatCurrency(memberSummary.balance)} - เพิ่มช่องทางเพื่อให้เพื่อนโอนได้
            </p>

            <div className="space-y-3 mb-4">
              {bill.paymentMethods
                .filter((method) => method.ownerId === selectedMember)
                .map((method, index) => (
                  <div key={index} className="p-4 bg-white rounded-xl border border-emerald-200">
                    {method.type === 'promptpay' && (
                      <div>
                        <Badge variant="info">พร้อมเพย์</Badge>
                        <p className="text-xl font-mono font-bold text-gray-900 mt-2">
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
                          className="block mt-2 text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                          📷 ดู QR Code
                        </a>
                      </div>
                    )}
                    {method.type === 'bank' && (
                      <div>
                        <Badge variant="warning">บัญชีธนาคาร</Badge>
                        <p className="font-bold text-gray-900 mt-2">{method.bankName}</p>
                        <p className="font-mono text-gray-900">{method.accountNumber}</p>
                        <p className="text-sm text-gray-700">{method.accountName}</p>
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
              + เพิ่มช่องทางรับเงิน
            </Button>
          </Card>
        )}

        {/* 4. Payment Slip Upload Section */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">💳 แนบสลิปการโอนเงิน</h3>

          {/* Check if deadline has passed */}
          {bill.optOutDeadline && new Date(bill.optOutDeadline) > new Date() ? (
            // Show notice while deadline is still active
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⏰</span>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 text-lg mb-2">
                    ยังไม่ถึงเวลาแนบสลิป
                  </p>
                  <p className="text-blue-700 mb-3">
                    การแนบสลิปจะเปิดให้ใช้งานหลังจากปิดรับคำขอไม่หาร
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-blue-300">
                    <p className="text-sm text-blue-800">
                      📅 สามารถแนบสลิปได้หลังจาก:{' '}
                      <span className="font-semibold">
                        {new Date(bill.optOutDeadline).toLocaleString('th-TH', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Show slip upload section after deadline
            member.paymentSlipUrl ? (
              <div className="space-y-4">
                {member.paymentVerified ? (
                  <div className="bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-400 rounded-xl p-5 shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-xl">✓</span>
                      </div>
                      <div>
                        <p className="text-emerald-800 font-bold text-lg">ยืนยันการชำระเงินแล้ว</p>
                        <p className="text-emerald-700 text-sm">Admin ได้ตรวจสอบสลิปของคุณเรียบร้อยแล้ว</p>
                      </div>
                    </div>
                    <img
                      src={member.paymentSlipUrl}
                      alt="Payment Slip"
                      className="w-full max-w-xs sm:max-w-sm rounded-lg border-2 border-emerald-400 mb-3 shadow-sm"
                    />
                    <div className="flex gap-2">
                      <a
                        href={member.paymentSlipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:text-emerald-800 font-medium text-sm hover:underline"
                      >
                        📷 ดูขนาดเต็ม
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">📎</span>
                      </div>
                      <div>
                        <p className="text-blue-800 font-medium">คุณได้แนบสลิปแล้ว</p>
                        <p className="text-blue-600 text-sm">รอ Admin ตรวจสอบ</p>
                      </div>
                    </div>
                    <img
                      src={member.paymentSlipUrl}
                      alt="Payment Slip"
                      className="w-full max-w-sm rounded-lg border border-blue-300 mb-3"
                    />
                    <div className="flex gap-2">
                      <a
                        href={member.paymentSlipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                      >
                        📷 ดูขนาดเต็ม
                      </a>
                      <button
                        onClick={handleRemoveSlip}
                        className="text-red-600 hover:text-red-700 font-medium text-sm hover:underline ml-4"
                      >
                        🗑️ ลบสลิป
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">แนบหลักฐานการโอนเงินเพื่อให้ Admin ตรวจสอบได้ง่ายขึ้น</p>

                {slipPreview ? (
                  <div className="space-y-3">
                    <img
                      src={slipPreview}
                      alt="Slip Preview"
                      className="w-full max-w-xs sm:max-w-sm rounded-lg border border-gray-300"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUploadSlip}
                        disabled={isUploadingSlip}
                        className="flex-1"
                      >
                        {isUploadingSlip ? 'กำลังอัปโหลด...' : 'อัปโหลดสลิป'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSlipFile(null);
                          setSlipPreview('');
                        }}
                        disabled={isUploadingSlip}
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlipFileChange}
                      className="hidden"
                      id="slip-upload"
                    />
                    <label htmlFor="slip-upload">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors">
                        <div className="text-4xl mb-2">📄</div>
                        <p className="text-gray-700 font-medium">คลิกเพื่อเลือกรูปสลิป</p>
                        <p className="text-gray-500 text-sm mt-1">รองรับ JPG, PNG, WEBP (สูงสุด 5MB)</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )
          )}
        </Card>

        {/* 5. Comments Section */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">ความคิดเห็น</h2>

          {/* Show member's comments */}
          <div className="space-y-3 mb-4">
            {bill.comments
              .filter((comment) => comment.memberId === selectedMember)
              .map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: member.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">{comment.memberName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('th-TH', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap break-words">{comment.message}</p>
                      {comment.adminReply && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-semibold text-indigo-600 mb-1">💬 ตอบกลับจาก Admin:</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.adminReply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Add comment form */}
          <div>
            <Input
              placeholder="พิมพ์ข้อความถึง Admin..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              className="mb-3"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              fullWidth
            >
              ส่งความคิดเห็น
            </Button>
          </div>
        </Card>

        {/* Back Button */}
        <div className="text-center pb-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/')}
          >
            ← กลับหน้าหลัก
          </Button>
        </div>
      </div>

      {/* Modal: Request opt-out */}
      {showRequestModal && requestItemId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ขอไม่หารเมนูนี้</h2>
            <p className="text-gray-600 mb-4">
              คุณต้องการขอไม่หารเมนู "{bill.items.find(i => i.id === requestItemId)?.name}" หรือไม่?
            </p>
            <Input
              placeholder="เหตุผล (ไม่บังคับ)"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestItemId(null);
                  setRequestReason('');
                }}
                fullWidth
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => handleSubmitRequest(requestItemId, requestType)}
                fullWidth
              >
                ส่งคำขอ
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Add Payment Method */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="max-w-md w-full my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">เพิ่มช่องทางรับเงิน</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภท
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentType('promptpay')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium ${
                    paymentType === 'promptpay'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  พร้อมเพย์
                </button>
                <button
                  onClick={() => setPaymentType('qrcode')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium ${
                    paymentType === 'qrcode'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  QR Code
                </button>
                <button
                  onClick={() => setPaymentType('bank')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium ${
                    paymentType === 'bank'
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  บัญชีธนาคาร
                </button>
              </div>
            </div>

            {paymentType === 'promptpay' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <Input
                  type="tel"
                  placeholder="0xx-xxx-xxxx"
                  value={promptPayPhone}
                  onChange={(e) => setPromptPayPhone(e.target.value)}
                />
              </div>
            )}

            {paymentType === 'qrcode' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อัพโหลด QR Code
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleQRFileChange}
                />
                {qrcodePreview && (
                  <img src={qrcodePreview} alt="Preview" className="mt-2 w-full max-w-xs sm:max-w-sm object-contain rounded-lg border border-gray-200" />
                )}
              </div>
            )}

            {paymentType === 'bank' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ธนาคาร
                  </label>
                  <Input
                    placeholder="ชื่อธนาคาร"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลขบัญชี
                  </label>
                  <Input
                    placeholder="xxx-x-xxxxx-x"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อบัญชี
                  </label>
                  <Input
                    placeholder="ชื่อเจ้าของบัญชี"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button
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
                fullWidth
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleSubmitPaymentRequest}
                disabled={isUploading}
                fullWidth
              >
                {isUploading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
