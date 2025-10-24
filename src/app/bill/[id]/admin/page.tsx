'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useBill } from '@/context/BillContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import {
  calculateMemberSummaries,
  calculateTransactions,
  formatCurrency,
  generateId,
  getMemberColor,
} from '@/lib/calculations';
import { BillItem, Member, PaymentMethod } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const billId = params.id as string;
  const adminCode = searchParams.get('code');

  const { bills, loadBill, addMember, updateMember, removeMember, addItem, updateItem, removeItem, addPaymentMethod, removePaymentMethod, updateRequest, updateComment, updatePaymentMethodRequest } = useBill();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCode, setAuthCode] = useState('');

  // Modals state
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  // Form state
  const [memberName, setMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [selectedPayers, setSelectedPayers] = useState<string[]>([]);
  const [selectedShared, setSelectedShared] = useState<string[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Payment form state
  const [paymentType, setPaymentType] = useState<'promptpay' | 'qrcode' | 'bank'>('promptpay');
  const [paymentOwnerId, setPaymentOwnerId] = useState('');
  const [promptPayPhone, setPromptPayPhone] = useState('');
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Request & Comment management state
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [commentReply, setCommentReply] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'items' | 'payments' | 'requests'>('overview');

  const bill = bills[billId];

  useEffect(() => {
    if (billId) {
      loadBill(billId);
    }
  }, [billId, loadBill]);

  useEffect(() => {
    if (adminCode && bill && adminCode === bill.adminId) {
      setIsAuthenticated(true);
    }
  }, [adminCode, bill]);

  if (!bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="text-center max-w-md w-full shadow-lg">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ไม่พบบิลนี้
          </h1>
          <Button onClick={() => router.push('/')}>กลับหน้าหลัก</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-5xl shadow-xl shadow-indigo-500/50">
              🔐
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Admin Access
            </h1>
            <p className="text-gray-700 text-base font-medium">
              กรุณากรอกรหัส Admin เพื่อเข้าถึงหน้านี้
            </p>
          </div>
          <div className="space-y-4">
            <Input
              label="รหัส Admin"
              placeholder="ใส่รหัส 6 ตัวอักษร"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl font-mono font-bold tracking-wider"
            />
            <Button
              onClick={() => {
                if (authCode === bill.adminId) {
                  setIsAuthenticated(true);
                } else {
                  alert('รหัสไม่ถูกต้อง!');
                }
              }}
              fullWidth
              size="lg"
            >
              เข้าสู่ระบบ
            </Button>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              ลืมรหัส Admin? ติดต่อผู้สร้างบิล
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const summaries = calculateMemberSummaries(bill);
  const transactions = calculateTransactions(summaries);
  const totalAmount = bill.items.reduce((sum, item) => sum + item.price, 0);

  const toggleMemberSelection = (memberId: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(memberId)) {
      setter(list.filter((id) => id !== memberId));
    } else {
      setter([...list, memberId]);
    }
  };

  const handleAddMember = () => {
    if (memberName.trim()) {
      if (editingMemberId) {
        // Update existing member
        updateMember(billId, editingMemberId, { name: memberName.trim() });
        setEditingMemberId(null);
      } else {
        // Add new member
        const newMember: Member = {
          id: generateId(),
          name: memberName.trim(),
          color: getMemberColor(bill.members.length),
        };
        addMember(billId, newMember);
      }
      setMemberName('');
      setShowAddMember(false);
    }
  };

  const handleEditMember = (member: Member) => {
    setMemberName(member.name);
    setEditingMemberId(member.id);
    setShowAddMember(true);
  };

  const handleAddItem = () => {
    if (itemName.trim() && itemPrice && selectedPayers.length > 0 && selectedShared.length > 0) {
      if (editingItemId) {
        // Update existing item
        updateItem(billId, editingItemId, {
          name: itemName.trim(),
          price: parseFloat(itemPrice),
          paidBy: selectedPayers,
          sharedBy: selectedShared,
        });
        setEditingItemId(null);
      } else {
        // Add new item
        const newItem: BillItem = {
          id: generateId(),
          name: itemName.trim(),
          price: parseFloat(itemPrice),
          paidBy: selectedPayers,
          sharedBy: selectedShared,
        };
        addItem(billId, newItem);
      }
      setItemName('');
      setItemPrice('');
      setSelectedPayers([]);
      setSelectedShared([]);
      setShowAddItem(false);
    }
  };

  const handleEditItem = (item: BillItem) => {
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setSelectedPayers(item.paidBy);
    setSelectedShared(item.sharedBy);
    setEditingItemId(item.id);
    setShowAddItem(true);
  };

  const handleAddPaymentMethod = () => {
    if (!paymentOwnerId) {
      alert('กรุณาเลือกเจ้าของบัญชี');
      return;
    }

    const owner = bill.members.find((m) => m.id === paymentOwnerId);
    if (!owner) return;

    let newMethod: PaymentMethod | null = null;

    if (paymentType === 'promptpay' && promptPayPhone.trim()) {
      newMethod = {
        type: 'promptpay',
        phoneNumber: promptPayPhone.trim(),
        ownerId: paymentOwnerId,
        ownerName: owner.name,
      };
    } else if (paymentType === 'qrcode' && qrcodeUrl.trim()) {
      newMethod = {
        type: 'qrcode',
        imageUrl: qrcodeUrl.trim(),
        ownerId: paymentOwnerId,
        ownerName: owner.name,
      };
    } else if (paymentType === 'bank' && bankName.trim() && accountNumber.trim() && accountName.trim()) {
      newMethod = {
        type: 'bank',
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        ownerId: paymentOwnerId,
        ownerName: owner.name,
      };
    }

    if (newMethod) {
      addPaymentMethod(billId, newMethod);
      setPaymentOwnerId('');
      setPromptPayPhone('');
      setQrcodeUrl('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      setShowAddPayment(false);
    }
  };

  const selectAllMembers = (setter: (list: string[]) => void) => {
    setter(bill.members.map((m) => m.id));
  };

  const deselectAllMembers = (setter: (list: string[]) => void) => {
    setter([]);
  };

  // Handle request approval/rejection
  const handleApproveRequest = async (requestId: string) => {
    const request = bill.requests.find((r) => r.id === requestId);
    if (!request) return;

    // Update the request status to approved
    await updateRequest(billId, requestId, { status: 'approved' });

    // Remove the member from the item's sharedBy list
    const item = bill.items.find((i) => i.id === request.itemId);
    if (item) {
      const updatedSharedBy = item.sharedBy.filter((id) => id !== request.memberId);
      await updateItem(billId, request.itemId, { sharedBy: updatedSharedBy });
    }

    alert('อนุมัติคำขอแล้ว! ระบบจะคำนวณยอดใหม่');
  };

  const handleRejectRequest = async (requestId: string) => {
    await updateRequest(billId, requestId, { status: 'rejected', adminMessage: 'ปฏิเสธโดย Admin' });
    alert('ปฏิเสธคำขอแล้ว');
  };

  // Handle comment reply
  const handleReplyToComment = async (commentId: string) => {
    if (!commentReply.trim()) return;
    await updateComment(billId, commentId, commentReply.trim());
    setReplyingToCommentId(null);
    setCommentReply('');
    alert('ตอบกลับความคิดเห็นแล้ว!');
  };

  // Handle payment method request approval
  const handleApprovePaymentRequest = async (requestId: string) => {
    const request = bill.paymentMethodRequests.find((r) => r.id === requestId);
    if (!request) return;

    // อนุมัติคำขอโดยเพิ่ม payment method เข้าไปจริง
    await updatePaymentMethodRequest(billId, requestId, { status: 'approved' });
    await addPaymentMethod(billId, request.paymentMethod);
    alert('อนุมัติคำขอแล้ว! เพิ่มช่องทางรับเงินเรียบร้อย');
  };

  // Handle payment method request rejection
  const handleRejectPaymentRequest = async (requestId: string) => {
    await updatePaymentMethodRequest(billId, requestId, {
      status: 'rejected',
      adminMessage: 'ปฏิเสธโดย Admin'
    });
    alert('ปฏิเสธคำขอแล้ว');
  };

  const memberLink = typeof window !== 'undefined' ? `${window.location.origin}/bill/${billId}` : '';
  const pendingRequestsCount = bill.requests.filter((r) => r.status === 'pending').length;
  const pendingPaymentRequestsCount = bill.paymentMethodRequests.filter((r) => r.status === 'pending').length;
  const unreadCommentsCount = bill.comments.filter((c) => !c.adminReply).length;

  // Tab configuration
  const tabs = [
    { id: 'overview' as const, label: 'ภาพรวม', icon: '📊' },
    { id: 'members' as const, label: 'สมาชิก', icon: '👥', count: bill.members.length },
    { id: 'items' as const, label: 'รายการอาหาร', icon: '🍽️', count: bill.items.length },
    { id: 'payments' as const, label: 'ช่องทางรับเงิน', icon: '💳', count: bill.paymentMethods.length },
    { id: 'requests' as const, label: 'คำขอ & คอมเมนต์', icon: '💬', badge: pendingRequestsCount + pendingPaymentRequestsCount + unreadCommentsCount },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pb-8">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Header */}
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center gap-2 text-white text-sm font-semibold">
                    <span>👑</span>
                    <span>Admin</span>
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded-full font-mono font-bold text-sm text-gray-700">
                    {bill.adminId}
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {bill.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                  {bill.location && (
                    <span className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{bill.location}</span>
                    </span>
                  )}
                  {bill.eventDate && (
                    <span className="flex items-center gap-1">
                      <span>📅</span>
                      <span>{new Date(bill.eventDate).toLocaleDateString('th-TH')}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span>💰</span>
                    <span className="font-bold text-indigo-600">{formatCurrency(totalAmount)}</span>
                  </span>
                </div>
              </div>
              <Button
                onClick={() => setShowShareLink(true)}
                size="sm"
                className="whitespace-nowrap"
              >
                📤 แชร์ลิงก์
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            <div className="flex gap-1 sm:gap-2 min-w-full sm:min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-semibold whitespace-nowrap
                    border-b-2 transition-all
                    ${activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-base sm:text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-bold
                      ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}
                    `}>
                      {tab.count}
                    </span>
                  )}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
                <p className="text-sm text-indigo-100 mb-1">ยอดรวมทั้งหมด</p>
                <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg">
                <p className="text-sm text-emerald-100 mb-1">สมาชิก</p>
                <p className="text-3xl font-bold">{bill.members.length}</p>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-lg">
                <p className="text-sm text-amber-100 mb-1">รายการอาหาร</p>
                <p className="text-3xl font-bold">{bill.items.length}</p>
              </Card>
              <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-none shadow-lg">
                <p className="text-sm text-rose-100 mb-1">ช่องทางรับเงิน</p>
                <p className="text-3xl font-bold">{bill.paymentMethods.length}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary */}
              <Card className="shadow-lg">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    📊 สรุปยอด
                  </h2>
                  <p className="text-gray-600">ยอดสุทธิของแต่ละคน</p>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {summaries.map((summary) => (
                    <div
                      key={summary.memberId}
                      className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full shadow-sm"
                            style={{
                              backgroundColor: bill.members.find((m) => m.id === summary.memberId)?.color,
                            }}
                          />
                          <span className="font-bold text-gray-900">
                            {summary.memberName}
                          </span>
                        </div>
                        <span
                          className={`font-bold text-lg ${
                            summary.balance >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          {summary.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary.balance))}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1 pl-10">
                        <p>หาร: {formatCurrency(summary.totalShared)}</p>
                        <p>จ่าย: {formatCurrency(summary.totalPaid)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Transactions */}
              <Card className="shadow-lg">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    💸 รายการโอนเงิน
                  </h2>
                  <p className="text-gray-600">ใครควรจ่ายให้ใคร</p>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.map((transaction, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm"
                    >
                      <p className="text-sm text-gray-600 mb-1">
                        {transaction.fromName} → {transaction.toName}
                      </p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-400">ไม่มีรายการโอนเงิน</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <Card className="shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    👥 สมาชิก ({bill.members.length})
                  </h2>
                  <p className="text-gray-600">จัดการสมาชิกในบิล</p>
                </div>
                <Button size="sm" onClick={() => setShowAddMember(true)}>
                  + เพิ่มสมาชิก
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {bill.members.map((member) => {
                  const memberSummary = summaries.find((s) => s.memberId === member.id);
                  return (
                    <div
                      key={member.id}
                      className="group relative p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-10 h-10 rounded-full shadow-sm"
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="font-bold text-gray-900 text-sm">
                          {member.name}
                        </span>
                      </div>
                      {memberSummary && (
                        <div className="text-sm">
                          <p className={`font-bold ${memberSummary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {memberSummary.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(memberSummary.balance))}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => handleEditMember(member)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ✏️
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="space-y-6">
            <Card className="shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    🍽️ รายการอาหาร ({bill.items.length})
                  </h2>
                  <p className="text-gray-600">จัดการรายการในบิล</p>
                </div>
                <Button size="sm" onClick={() => setShowAddItem(true)}>
                  + เพิ่มรายการ
                </Button>
              </div>
              <div className="space-y-3">
                {bill.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                        <p className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('ยืนยันการลบรายการนี้?')) {
                              removeItem(billId, item.id);
                            }
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">💳 จ่ายโดย:</span>
                        <span>{item.paidBy.map((id) => bill.members.find((m) => m.id === id)?.name).join(', ')}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">🍴 หารกัน:</span>
                        <span>{item.sharedBy.map((id) => bill.members.find((m) => m.id === id)?.name).join(', ')}</span>
                      </p>
                    </div>
                  </div>
                ))}
                {bill.items.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-lg">ยังไม่มีรายการ</p>
                    <p className="text-gray-500 text-sm">คลิกปุ่ม "+ เพิ่ม" เพื่อเพิ่มรายการ</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <Card className="shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    💳 ช่องทางรับเงิน ({bill.paymentMethods.length})
                  </h2>
                  <p className="text-gray-600">จัดการช่องทางการชำระเงิน</p>
                </div>
                <Button size="sm" onClick={() => setShowAddPayment(true)}>
                  + เพิ่มช่องทาง
                </Button>
              </div>
              <div className="space-y-3">
                {bill.paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default">{method.ownerName}</Badge>
                          {method.type === 'promptpay' && <Badge variant="info">พร้อมเพย์</Badge>}
                          {method.type === 'qrcode' && <Badge variant="success">QR Code</Badge>}
                          {method.type === 'bank' && <Badge variant="warning">บัญชีธนาคาร</Badge>}
                        </div>
                        {method.type === 'promptpay' && (
                          <p className="text-gray-900 font-mono">{method.phoneNumber}</p>
                        )}
                        {method.type === 'qrcode' && (
                          <p className="text-gray-700 text-sm truncate">{method.imageUrl}</p>
                        )}
                        {method.type === 'bank' && (
                          <p className="text-sm text-gray-900">
                            {method.bankName} - {method.accountNumber} ({method.accountName})
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('ยืนยันการลบช่องทางนี้?')) {
                            removePaymentMethod(billId, index);
                          }
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-3"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {bill.paymentMethods.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-lg">ยังไม่มีช่องทางรับเงิน</p>
                    <p className="text-gray-500 text-sm">คลิกปุ่ม "+ เพิ่ม" เพื่อเพิ่มช่องทาง</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Payment Method Requests */}
            {bill.paymentMethodRequests.filter((r) => r.status === 'pending').length > 0 && (
              <Card className="shadow-lg">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    💳 คำขอเพิ่มช่องทางรับเงิน
                  </h2>
                  <p className="text-gray-600">คำขอที่รอการพิจารณา ({bill.paymentMethodRequests.filter((r) => r.status === 'pending').length})</p>
                </div>
                <div className="space-y-3">
                  {bill.paymentMethodRequests
                    .filter((request) => request.status === 'pending')
                    .map((request) => (
                      <div
                        key={request.id}
                        className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 shadow-sm"
                      >
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="warning">รอพิจารณา</Badge>
                            <span className="font-bold text-gray-900">
                              {request.memberName}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            ขอเพิ่มช่องทางรับเงิน
                          </p>

                          {/* Payment method details */}
                          <div className="mt-3 p-3 bg-white rounded-lg">
                            {request.paymentMethod.type === 'promptpay' && (
                              <div>
                                <Badge variant="info" size="sm">พร้อมเพย์</Badge>
                                <p className="text-lg font-mono font-bold text-gray-900 mt-2">
                                  {request.paymentMethod.phoneNumber}
                                </p>
                              </div>
                            )}
                            {request.paymentMethod.type === 'qrcode' && (
                              <div>
                                <Badge variant="success" size="sm">QR Code</Badge>
                                <img
                                  src={request.paymentMethod.imageUrl}
                                  alt="QR Code"
                                  className="w-32 h-32 object-contain mt-2 border border-gray-200 rounded-lg"
                                />
                                <a
                                  href={request.paymentMethod.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block mt-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm hover:underline"
                                >
                                  📷 ดูขนาดเต็ม
                                </a>
                              </div>
                            )}
                            {request.paymentMethod.type === 'bank' && (
                              <div>
                                <Badge variant="warning" size="sm">บัญชีธนาคาร</Badge>
                                <p className="text-base font-bold text-gray-900 mt-2">
                                  {request.paymentMethod.bankName}
                                </p>
                                <p className="text-base font-mono text-gray-900">
                                  {request.paymentMethod.accountNumber}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {request.paymentMethod.accountName}
                                </p>
                              </div>
                            )}
                          </div>

                          {request.reason && (
                            <p className="text-sm text-gray-600 italic mt-2">
                              เหตุผล: {request.reason}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprovePaymentRequest(request.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            ✓ อนุมัติ
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRejectPaymentRequest(request.id)}
                            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700"
                          >
                            ✕ ปฏิเสธ
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Item Requests */}
            {bill.requests.filter((r) => r.status === 'pending').length > 0 && (
              <Card className="shadow-lg">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    📝 คำขอไม่หารรายการ
                  </h2>
                  <p className="text-gray-600">คำขอที่รอการพิจารณา ({bill.requests.filter((r) => r.status === 'pending').length})</p>
                </div>
                <div className="space-y-3">
                  {bill.requests
                    .filter((request) => request.status === 'pending')
                    .map((request) => (
                      <div
                        key={request.id}
                        className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm"
                      >
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="warning">รอพิจารณา</Badge>
                            <span className="font-bold text-gray-900">
                              {request.memberName}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">
                            ขอไม่หารเมนู: <span className="font-semibold">{request.itemName}</span>
                          </p>
                          {request.reason && (
                            <p className="text-sm text-gray-600 italic">
                              เหตุผล: {request.reason}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            ✓ อนุมัติ
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700"
                          >
                            ✕ ปฏิเสธ
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Comments Management */}
            {bill.comments.length > 0 && (
              <Card className="shadow-lg">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    💬 ความคิดเห็น
                  </h2>
                  <p className="text-gray-600">ข้อความจากสมาชิก</p>
                </div>
                <div className="space-y-3">
                  {bill.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm"
                    >
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-900">
                            {comment.memberName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString('th-TH')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {comment.message}
                        </p>
                        {comment.adminReply ? (
                          <div className="mt-2 pt-2 border-t border-indigo-200">
                            <p className="text-xs font-semibold text-indigo-600 mb-1">
                              ตอบกลับของคุณ:
                            </p>
                            <p className="text-sm text-gray-900">{comment.adminReply}</p>
                          </div>
                        ) : replyingToCommentId === comment.id ? (
                          <div className="mt-3 pt-3 border-t border-indigo-200 space-y-2">
                            <textarea
                              placeholder="พิมพ์คำตอบกลับ..."
                              value={commentReply}
                              onChange={(e) => setCommentReply(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border-2 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400 text-sm resize-none"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleReplyToComment(comment.id)}
                                disabled={!commentReply.trim()}
                              >
                                ส่งคำตอบ
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setReplyingToCommentId(null);
                                  setCommentReply('');
                                }}
                              >
                                ยกเลิก
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyingToCommentId(comment.id)}
                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                          >
                            ↩ ตอบกลับ
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Member Modal */}
      <Modal
        isOpen={showAddMember}
        onClose={() => {
          setShowAddMember(false);
          setEditingMemberId(null);
          setMemberName('');
        }}
        title={editingMemberId ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิก'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddMember(false);
                setEditingMemberId(null);
                setMemberName('');
              }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleAddMember} disabled={!memberName.trim()}>
              {editingMemberId ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </>
        }
      >
        <Input
          label="ชื่อสมาชิก"
          placeholder="ชื่อ"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
          autoFocus
        />
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          setEditingItemId(null);
          setItemName('');
          setItemPrice('');
          setSelectedPayers([]);
          setSelectedShared([]);
        }}
        title={editingItemId ? 'แก้ไขรายการอาหาร' : 'เพิ่มรายการอาหาร'}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddItem(false);
                setEditingItemId(null);
                setItemName('');
                setItemPrice('');
                setSelectedPayers([]);
                setSelectedShared([]);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={
                !itemName.trim() ||
                !itemPrice ||
                selectedPayers.length === 0 ||
                selectedShared.length === 0
              }
            >
              {editingItemId ? 'บันทึกรายการ' : 'เพิ่มรายการ'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="ชื่อเมนู"
            placeholder="เช่น ข้าวผัด"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <Input
            label="ราคา (บาท)"
            type="number"
            placeholder="0.00"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
          />

          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">
              ใครจ่ายเงิน?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {bill.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleMemberSelection(member.id, selectedPayers, setSelectedPayers)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedPayers.includes(member.id)
                      ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: member.color }} />
                    <span className="text-sm font-bold text-gray-900">{member.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-900">
                ใครกิน? (หารกัน)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => selectAllMembers(setSelectedShared)}
                >
                  เลือกทั้งหมด
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deselectAllMembers(setSelectedShared)}
                >
                  ล้าง
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {bill.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleMemberSelection(member.id, selectedShared, setSelectedShared)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedShared.includes(member.id)
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: member.color }} />
                    <span className="text-sm font-bold text-gray-900">{member.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={showAddPayment}
        onClose={() => {
          setShowAddPayment(false);
          setPaymentOwnerId('');
          setPromptPayPhone('');
          setQrcodeUrl('');
          setBankName('');
          setAccountNumber('');
          setAccountName('');
        }}
        title="เพิ่มช่องทางรับเงิน"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddPayment(false);
                setPaymentOwnerId('');
                setPromptPayPhone('');
                setQrcodeUrl('');
                setBankName('');
                setAccountNumber('');
                setAccountName('');
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddPaymentMethod}
              disabled={!paymentOwnerId}
            >
              เพิ่มช่องทาง
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              เจ้าของบัญชี
            </label>
            <select
              value={paymentOwnerId}
              onChange={(e) => setPaymentOwnerId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm hover:border-gray-300 font-medium"
            >
              <option value="">-- เลือกสมาชิก --</option>
              {bill.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={paymentType === 'promptpay' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setPaymentType('promptpay')}
            >
              พร้อมเพย์
            </Button>
            <Button
              variant={paymentType === 'qrcode' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setPaymentType('qrcode')}
            >
              QR Code
            </Button>
            <Button
              variant={paymentType === 'bank' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setPaymentType('bank')}
            >
              บัญชีธนาคาร
            </Button>
          </div>

          {paymentType === 'promptpay' && (
            <Input
              placeholder="เบอร์โทรศัพท์พร้อมเพย์"
              value={promptPayPhone}
              onChange={(e) => setPromptPayPhone(e.target.value)}
            />
          )}

          {paymentType === 'qrcode' && (
            <Input
              placeholder="URL ของ QR Code"
              value={qrcodeUrl}
              onChange={(e) => setQrcodeUrl(e.target.value)}
            />
          )}

          {paymentType === 'bank' && (
            <div className="space-y-2">
              <Input
                placeholder="ชื่อธนาคาร"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
              <Input
                placeholder="เลขบัญชี"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
              <Input
                placeholder="ชื่อบัญชี"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Share Link Modal */}
      <Modal
        isOpen={showShareLink}
        onClose={() => setShowShareLink(false)}
        title="แชร์ลิงก์ให้สมาชิก"
        footer={
          <Button
            onClick={() => {
              navigator.clipboard.writeText(memberLink);
              alert('คัดลอกลิงก์แล้ว!');
            }}
            fullWidth
          >
            📋 คัดลอกลิงก์
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700 text-base">
            ส่งลิงก์นี้ให้สมาชิกเพื่อให้พวกเขาเข้ามาดูข้อมูลและยอดเงินที่ต้องจ่าย
          </p>
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">ลิงก์สำหรับสมาชิก</p>
            <p className="text-sm font-mono text-gray-900 break-all font-semibold">
              {memberLink}
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🔐</span>
              <p className="text-sm font-bold text-indigo-900 uppercase tracking-wide">
                รหัส Admin ของคุณ
              </p>
            </div>
            <p className="text-4xl font-bold font-mono bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 tracking-wider">
              {bill.adminId}
            </p>
            <p className="text-sm text-indigo-800 font-medium">
              เก็บรหัสนี้ไว้เพื่อเข้าหน้า Admin ในครั้งถัดไป
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
