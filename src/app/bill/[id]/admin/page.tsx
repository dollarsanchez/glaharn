'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useBill } from '@/context/BillContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Sidebar from '@/components/admin/Sidebar';
import FAB from '@/components/admin/FAB';
import Analytics from '@/components/admin/Analytics';
import CollectionDashboard from '@/components/admin/CollectionDashboard';
import ActivityLog from '@/components/admin/ActivityLog';
import CommandPalette from '@/components/admin/CommandPalette';
import PaymentTimeline from '@/components/admin/PaymentTimeline';
import BottomNav from '@/components/admin/BottomNav';
import BillTemplates from '@/components/admin/BillTemplates';
import BatchSlipUpload from '@/components/admin/BatchSlipUpload';
import SwipeableCard from '@/components/admin/SwipeableCard';
import MemberPaymentMethods from '@/components/admin/MemberPaymentMethods';
import MemberPaymentSlips from '@/components/admin/MemberPaymentSlips';
import TabHeader from '@/components/admin/TabHeader';
import EmptyState from '@/components/admin/EmptyState';
import CardActions from '@/components/admin/CardActions';
import {
  calculateMemberSummaries,
  calculateTransactions,
  formatCurrency,
  generateId,
  getMemberColor,
} from '@/lib/calculations';
import { BillItem, Member, PaymentMethod } from '@/types';
import { uploadQRCode, validateImageFile } from '@/lib/storage';
import { useToast } from '@/components/ui/Toast';

export default function AdminDashboard() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const billId = params.id as string;
  const adminCode = searchParams.get('code');

  const { bills, loadBill, deleteBill, setOptOutDeadline, addMember, updateMember, removeMember, addItem, updateItem, removeItem, addPaymentMethod, removePaymentMethod, updateRequest, updateComment, updatePaymentMethodRequest } = useBill();
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCode, setAuthCode] = useState('');

  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Modals state
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  // Multi-step wizard for Add Item
  const [itemWizardStep, setItemWizardStep] = useState(1);

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
  const [qrcodeFile, setQrcodeFile] = useState<File | null>(null);
  const [qrcodePreview, setQrcodePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Request & Comment management state
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [commentReply, setCommentReply] = useState('');

  // Opt-out deadline state
  const [optOutDeadlineDate, setOptOutDeadlineDate] = useState('');
  const [optOutDeadlineTime, setOptOutDeadlineTime] = useState('');

  // Search state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');

  // Filter & Sort state
  const [memberFilter, setMemberFilter] = useState<'all' | 'verified' | 'pending' | 'notpaid'>('all');
  const [memberSort, setMemberSort] = useState<'name' | 'balance' | 'amount'>('name');
  const [quickSplitMode, setQuickSplitMode] = useState<'custom' | 'equal' | 'common'>('custom');

  const bill = bills[billId];

  useEffect(() => {
    if (billId) {
      loadBill(billId);
    }
  }, [billId, loadBill]);

  useEffect(() => {
    if (adminCode && bill && !isAuthenticated && adminCode.toUpperCase() === bill.adminId.toUpperCase()) {
      setIsAuthenticated(true);
      showToast('เข้าสู่หน้า Admin สำเร็จ!', 'success');
    }
  }, [adminCode, bill, isAuthenticated, showToast]);

  useEffect(() => {
    if (isAuthenticated && bill) {
      const pendingPaymentRequests = bill.paymentMethodRequests.filter((r) => r.status === 'pending').length;
      const pendingItemRequests = bill.requests.filter((r) => r.status === 'pending').length;
      const unreadComments = bill.comments.filter((c) => !c.adminReply).length;

      const totalPending = pendingPaymentRequests + pendingItemRequests + unreadComments;

      if (totalPending > 0) {
        const messages = [];
        if (pendingPaymentRequests > 0) messages.push(`${pendingPaymentRequests} คำขอเพิ่มช่องทางรับเงิน`);
        if (pendingItemRequests > 0) messages.push(`${pendingItemRequests} คำขอไม่หารรายการ`);
        if (unreadComments > 0) messages.push(`${unreadComments} ความคิดเห็นใหม่`);

        showToast(`มี ${messages.join(', ')} รอตรวจสอบ`, 'info');
      }
    }
  }, [isAuthenticated, bill?.id]);

  if (!bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="text-center max-w-md w-full shadow-xl">
          <div className="text-6xl mb-4">📭</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ไม่พบบิลนี้
          </h1>
          <p className="text-gray-600 mb-6">บิลอาจถูกลบหรือไม่มีอยู่จริง</p>
          <Button onClick={() => router.push('/')}>กลับหน้าหลัก</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-5xl shadow-xl">
              🔐
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Admin Access
            </h1>
            <p className="text-gray-600 text-base">
              กรุณากรอกรหัส Admin เพื่อเข้าถึงหน้าจัดการ
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
                  showToast('เข้าสู่หน้า Admin สำเร็จ!', 'success');
                } else {
                  showToast('รหัสไม่ถูกต้อง!', 'error');
                }
              }}
              fullWidth
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
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
  const transactions = calculateTransactions(summaries, bill);
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
        updateMember(billId, editingMemberId, { name: memberName.trim() });
        setEditingMemberId(null);
      } else {
        const newMember: Member = {
          id: generateId(),
          name: memberName.trim(),
          color: getMemberColor(bill.members.length),
        };
        addMember(billId, newMember);
      }
      setMemberName('');
      setShowAddMember(false);
      showToast('เพิ่มสมาชิกสำเร็จ!', 'success');
    }
  };

  const handleEditMember = (member: Member) => {
    setMemberName(member.name);
    setEditingMemberId(member.id);
    setShowAddMember(true);
  };

  const handleDeleteMember = async (member: Member) => {
    const hasItems = bill.items.some(
      (item) => item.paidBy.includes(member.id) || item.sharedBy.includes(member.id)
    );

    if (hasItems) {
      const confirmed = confirm(
        `สมาชิก "${member.name}" มีรายการอาหารที่เกี่ยวข้อง\n\nการลบสมาชิกจะลบรายการเหล่านี้ออกด้วย คุณต้องการดำเนินการต่อหรือไม่?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิก "${member.name}"?`
      );
      if (!confirmed) return;
    }

    try {
      await removeMember(billId, member.id);
      showToast('ลบสมาชิกสำเร็จ!', 'success');
      setSelectedMemberId(null);
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการลบสมาชิก', 'error');
    }
  };

  const handleAddItem = () => {
    if (itemName.trim() && itemPrice && selectedPayers.length > 0 && selectedShared.length > 0) {
      if (editingItemId) {
        updateItem(billId, editingItemId, {
          name: itemName.trim(),
          price: parseFloat(itemPrice),
          paidBy: selectedPayers,
          sharedBy: selectedShared,
        });
        setEditingItemId(null);
        showToast('แก้ไขรายการสำเร็จ!', 'success');
      } else {
        const newItem: BillItem = {
          id: generateId(),
          name: itemName.trim(),
          price: parseFloat(itemPrice),
          paidBy: selectedPayers,
          sharedBy: selectedShared,
        };
        addItem(billId, newItem);
        showToast('เพิ่มรายการสำเร็จ!', 'success');
      }
      setItemName('');
      setItemPrice('');
      setSelectedPayers([]);
      setSelectedShared([]);
      setShowAddItem(false);
      setItemWizardStep(1);
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

  const handleQRFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      setQrcodeFile(file);

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

  const handleAddPaymentMethod = async () => {
    if (!paymentOwnerId) {
      showToast('กรุณาเลือกเจ้าของบัญชี', 'warning');
      return;
    }

    const owner = bill.members.find((m) => m.id === paymentOwnerId);
    if (!owner) return;

    setIsUploading(true);
    let newMethod: PaymentMethod | null = null;

    try {
      if (paymentType === 'promptpay' && promptPayPhone.trim()) {
        newMethod = {
          type: 'promptpay',
          phoneNumber: promptPayPhone.trim(),
          ownerId: paymentOwnerId,
          ownerName: owner.name,
        };
      } else if (paymentType === 'qrcode' && qrcodeFile) {
        const imageUrl = await uploadQRCode(qrcodeFile, billId);
        newMethod = {
          type: 'qrcode',
          imageUrl: imageUrl,
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
      } else {
        showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
        setIsUploading(false);
        return;
      }

      if (newMethod) {
        await addPaymentMethod(billId, newMethod);
        setPaymentOwnerId('');
        setPromptPayPhone('');
        setQrcodeFile(null);
        setQrcodePreview('');
        setBankName('');
        setAccountNumber('');
        setAccountName('');
        setShowAddPayment(false);
        showToast('เพิ่มช่องทางรับเงินเรียบร้อย', 'success');
      }
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      showToast(error.message || 'เกิดข้อผิดพลาดในการเพิ่มช่องทางรับเงิน', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const selectAllMembers = (setter: (list: string[]) => void) => {
    setter(bill.members.map((m) => m.id));
  };

  const deselectAllMembers = (setter: (list: string[]) => void) => {
    setter([]);
  };

  const handleApproveRequest = async (requestId: string) => {
    const request = bill.requests.find((r) => r.id === requestId);
    if (!request) return;

    await updateRequest(billId, requestId, { status: 'approved' });

    const item = bill.items.find((i) => i.id === request.itemId);
    if (item) {
      const updatedSharedBy = item.sharedBy.filter((id) => id !== request.memberId);
      await updateItem(billId, request.itemId, { sharedBy: updatedSharedBy });
    }

    showToast('อนุมัติคำขอแล้ว! ระบบจะคำนวณยอดใหม่', 'success');
  };

  const handleRejectRequest = async (requestId: string) => {
    await updateRequest(billId, requestId, { status: 'rejected', adminMessage: 'ปฏิเสธโดย Admin' });
    showToast('ปฏิเสธคำขอแล้ว', 'info');
  };

  const handleReplyToComment = async (commentId: string) => {
    if (!commentReply.trim()) return;
    await updateComment(billId, commentId, commentReply.trim());
    setReplyingToCommentId(null);
    setCommentReply('');
    showToast('ตอบกลับความคิดเห็นแล้ว!', 'success');
  };

  const handleApprovePaymentRequest = async (requestId: string) => {
    const request = bill.paymentMethodRequests.find((r) => r.id === requestId);
    if (!request) return;

    try {
      await updatePaymentMethodRequest(billId, requestId, { status: 'approved' });
      await addPaymentMethod(billId, request.paymentMethod);
      showToast('อนุมัติคำขอแล้ว! เพิ่มช่องทางรับเงินเรียบร้อย', 'success');
    } catch (error) {
      console.error('Error approving payment request:', error);
      showToast('เกิดข้อผิดพลาดในการอนุมัติ', 'error');
    }
  };

  const handleRejectPaymentRequest = async (requestId: string) => {
    await updatePaymentMethodRequest(billId, requestId, {
      status: 'rejected',
      adminMessage: 'ปฏิเสธโดย Admin'
    });
    showToast('ปฏิเสธคำขอแล้ว', 'info');
  };

  const handleSetOptOutDeadline = async () => {
    if (!optOutDeadlineDate || !optOutDeadlineTime) {
      showToast('กรุณาเลือกวันที่และเวลา', 'error');
      return;
    }

    try {
      const deadlineDateTime = new Date(`${optOutDeadlineDate}T${optOutDeadlineTime}`);
      await setOptOutDeadline(billId, deadlineDateTime);
      showToast('ตั้งเวลาปิดรับคำขอไม่หารสำเร็จ!', 'success');
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการตั้งเวลา', 'error');
    }
  };

  const handleClearOptOutDeadline = async () => {
    try {
      await setOptOutDeadline(billId, null);
      setOptOutDeadlineDate('');
      setOptOutDeadlineTime('');
      showToast('ยกเลิกการจำกัดเวลาสำเร็จ!', 'success');
    } catch (error) {
      showToast('เกิดข้อผิดพลาดในการยกเลิก', 'error');
    }
  };

  const handleDeleteBill = async () => {
    const confirmed = confirm(
      `⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบบิล "${bill.name}"?\n\nการลบบิลจะไม่สามารถกู้คืนได้!`
    );

    if (confirmed) {
      try {
        await deleteBill(billId);
        showToast('ลบบิลสำเร็จ!', 'success');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (error) {
        showToast('เกิดข้อผิดพลาดในการลบบิล', 'error');
      }
    }
  };

  const memberLink = typeof window !== 'undefined' ? `${window.location.origin}/bill/${billId}` : '';
  const pendingRequestsCount = bill.requests.filter((r) => r.status === 'pending').length;
  const pendingPaymentRequestsCount = bill.paymentMethodRequests.filter((r) => r.status === 'pending').length;
  const unreadCommentsCount = bill.comments.filter((c) => !c.adminReply).length;
  const totalPendingCount = pendingRequestsCount + pendingPaymentRequestsCount + unreadCommentsCount;

  // Filter data with advanced filtering and sorting
  let filteredMembers = bill.members.filter((member) => {
    // Search filter
    const matchesSearch = member.name.toLowerCase().includes(memberSearchQuery.toLowerCase());

    // Status filter
    let matchesFilter = true;
    if (memberFilter === 'verified') {
      matchesFilter = member.paymentVerified === true;
    } else if (memberFilter === 'pending') {
      matchesFilter = member.paymentSlipUrl !== undefined && !member.paymentVerified;
    } else if (memberFilter === 'notpaid') {
      matchesFilter = !member.paymentSlipUrl;
    }

    return matchesSearch && matchesFilter;
  });

  // Sort members
  filteredMembers = [...filteredMembers].sort((a, b) => {
    const summaryA = summaries.find(s => s.memberId === a.id);
    const summaryB = summaries.find(s => s.memberId === b.id);

    if (memberSort === 'name') {
      return a.name.localeCompare(b.name);
    } else if (memberSort === 'balance') {
      return (summaryB?.balance || 0) - (summaryA?.balance || 0);
    } else if (memberSort === 'amount') {
      return (summaryB?.totalPaid || 0) - (summaryA?.totalPaid || 0);
    }
    return 0;
  });

  const filteredItems = bill.items.filter((item) =>
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const filteredPayments = bill.paymentMethods.filter((payment) =>
    payment.ownerName.toLowerCase().includes(paymentSearchQuery.toLowerCase())
  );

  // Selected member detail
  const selectedMember = bill.members.find((m) => m.id === selectedMemberId);
  const selectedMemberSummary = summaries.find((s) => s.memberId === selectedMemberId);

  // Selected item detail
  const selectedItem = bill.items.find((i) => i.id === selectedItemId);

  // FAB Actions
  const fabActions = [
    {
      id: 'add-member',
      label: 'Add Member',
      icon: '👤',
      onClick: () => setShowAddMember(true),
    },
    {
      id: 'add-item',
      label: 'Add Item',
      icon: '🍽️',
      onClick: () => setShowAddItem(true),
    },
    {
      id: 'add-payment',
      label: 'Add Payment',
      icon: '💳',
      onClick: () => setShowAddPayment(true),
    },
    {
      id: 'share',
      label: 'Share Link',
      icon: '📤',
      onClick: () => setShowShareLink(true),
    },
  ];

  // Command Palette Commands
  const commands = [
    {
      id: 'goto-dashboard',
      label: 'Go to Dashboard',
      icon: '🏠',
      action: () => setActiveTab('dashboard'),
      keywords: ['home', 'overview'],
    },
    {
      id: 'goto-members',
      label: 'Go to Members',
      icon: '👥',
      action: () => setActiveTab('members'),
      keywords: ['people', 'users'],
    },
    {
      id: 'goto-items',
      label: 'Go to Items',
      icon: '🍽️',
      action: () => setActiveTab('items'),
      keywords: ['dishes', 'food'],
    },
    {
      id: 'goto-payments',
      label: 'Go to Payments',
      icon: '💳',
      action: () => setActiveTab('payments'),
      keywords: ['money', 'bank'],
    },
    {
      id: 'goto-requests',
      label: 'Go to Requests',
      icon: '💬',
      action: () => setActiveTab('requests'),
      keywords: ['pending', 'inbox'],
    },
    {
      id: 'goto-settings',
      label: 'Go to Settings',
      icon: '⚙️',
      action: () => setActiveTab('settings'),
      keywords: ['config', 'preferences'],
    },
    {
      id: 'add-member',
      label: 'Add Member',
      icon: '👤',
      action: () => setShowAddMember(true),
      keywords: ['new', 'person', 'user'],
    },
    {
      id: 'add-item',
      label: 'Add Item',
      icon: '🍽️',
      action: () => setShowAddItem(true),
      keywords: ['new', 'dish', 'food'],
    },
    {
      id: 'add-payment',
      label: 'Add Payment Method',
      icon: '💳',
      action: () => setShowAddPayment(true),
      keywords: ['new', 'bank', 'promptpay'],
    },
    {
      id: 'share',
      label: 'Share Link',
      icon: '📤',
      action: () => setShowShareLink(true),
      keywords: ['copy', 'send'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={totalPendingCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                    {bill.name}
                  </h1>
                  <div className="px-2 py-1 bg-emerald-100 rounded-full text-xs font-mono font-bold text-emerald-700">
                    {bill.adminId}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
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
                    <span className="font-bold text-emerald-600">{formatCurrency(totalAmount)}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowShareLink(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>

                {totalPendingCount > 0 && (
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Notifications"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {totalPendingCount}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 pb-24 lg:pb-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Total Amount</p>
                      <p className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
                    </div>
                    <div className="text-5xl opacity-80">💰</div>
                  </div>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab('members')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Members</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{bill.members.length}</p>
                    </div>
                    <div className="text-5xl">👥</div>
                  </div>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab('items')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Items</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{bill.items.length}</p>
                    </div>
                    <div className="text-5xl">🍽️</div>
                  </div>
                </Card>

                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab('requests')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Pending</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{totalPendingCount}</p>
                    </div>
                    <div className="text-5xl">💬</div>
                  </div>
                </Card>
              </div>

              {/* Analytics Charts */}
              <Analytics bill={bill} summaries={summaries} />

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Collection Dashboard */}
                <CollectionDashboard bill={bill} summaries={summaries} />

                {/* Activity Log */}
                <ActivityLog bill={bill} />
              </div>

              {/* Members Summary Table */}
              <Card className="shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Members Summary</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Member</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Paid</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Balance</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summaries.map((summary) => {
                        const member = bill.members.find((m) => m.id === summary.memberId);
                        if (!member) return null;
                        return (
                          <tr key={summary.memberId} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                            setSelectedMemberId(member.id);
                            setActiveTab('members');
                          }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: member.color }}
                                />
                                <span className="font-medium text-gray-900">{member.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 font-medium">
                              {formatCurrency(summary.totalPaid)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-bold ${summary.balance > 0 ? 'text-emerald-600' : summary.balance < 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                                {formatCurrency(Math.abs(summary.balance))}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {member.paymentVerified ? (
                                <Badge variant="success">Verified</Badge>
                              ) : member.paymentSlipUrl ? (
                                <Badge variant="warning">Pending</Badge>
                              ) : (
                                <Badge variant="default">Not Paid</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Transactions */}
              {transactions.length > 0 && (
                <Card className="shadow-lg">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Transactions Timeline</h2>
                  <div className="space-y-3">
                    {transactions.map((tx, index) => {
                      const fromMember = bill.members.find((m) => m.id === tx.from);
                      const toMember = bill.members.find((m) => m.id === tx.to);
                      if (!fromMember || !toMember) return null;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1 flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                              style={{ backgroundColor: fromMember.color }}
                            >
                              {fromMember.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{fromMember.name}</p>
                              <p className="text-sm text-gray-500">Must transfer</p>
                            </div>
                          </div>
                          <div className="text-2xl text-emerald-600 font-bold">→</div>
                          <div className="flex-1 flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                              style={{ backgroundColor: toMember.color }}
                            >
                              {toMember.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{toMember.name}</p>
                              <p className="text-sm text-gray-500">Receives</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(tx.amount)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Members Tab - Split View */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <TabHeader
                icon="👥"
                title="Members"
                count={bill.members.length}
                description={`Manage participants in ${bill.name}`}
                addLabel="Add Member"
                onAdd={() => setShowAddMember(true)}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
              {/* List */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <Card className="shadow-lg space-y-3">
                  <Input
                    placeholder="🔍 Search members..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Filter by</label>
                      <select
                        value={memberFilter}
                        onChange={(e) => setMemberFilter(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="all">All</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="notpaid">Not Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
                      <select
                        value={memberSort}
                        onChange={(e) => setMemberSort(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="name">Name</option>
                        <option value="balance">Balance</option>
                        <option value="amount">Amount</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredMembers.length === 0 ? (
                    <EmptyState
                      icon="👥"
                      title="No members yet"
                      description="Add members to start splitting the bill"
                      actionLabel="Add First Member"
                      onAction={() => setShowAddMember(true)}
                    />
                  ) : (
                    filteredMembers.map((member) => {
                    const summary = summaries.find((s) => s.memberId === member.id);
                    const isSelected = selectedMemberId === member.id;
                    return (
                      <SwipeableCard
                        key={member.id}
                        leftActions={[
                          {
                            id: 'edit',
                            label: 'Edit',
                            icon: '✏️',
                            color: 'text-blue-700',
                            bgColor: 'bg-blue-100',
                            onClick: () => handleEditMember(member),
                          },
                        ]}
                        rightActions={[
                          {
                            id: 'delete',
                            label: 'Delete',
                            icon: '🗑️',
                            color: 'text-rose-700',
                            bgColor: 'bg-rose-100',
                            onClick: () => handleDeleteMember(member),
                          },
                        ]}
                      >
                        <Card
                          className={`cursor-pointer transition-all group ${
                            isSelected
                              ? 'shadow-lg ring-2 ring-emerald-500 bg-emerald-50'
                              : 'shadow hover:shadow-md'
                          }`}
                          onClick={() => setSelectedMemberId(member.id)}
                        >
                          <div className="relative">
                            {/* Desktop actions - top right */}
                            <div className="absolute top-0 right-0 z-10">
                              <CardActions
                                actions={[
                                  {
                                    icon: '✏️',
                                    label: 'Edit',
                                    onClick: () => handleEditMember(member),
                                    variant: 'primary',
                                  },
                                  {
                                    icon: '🗑️',
                                    label: 'Delete',
                                    onClick: () => handleDeleteMember(member),
                                    variant: 'danger',
                                  },
                                ]}
                              />
                            </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md"
                                style={{ backgroundColor: member.color }}
                              >
                                {member.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">{member.name}</p>
                                {summary && (
                                  <p className="text-sm text-gray-600">
                                    Paid: <span className="font-semibold text-emerald-600">
                                      {formatCurrency(summary.totalPaid)}
                                    </span>
                                  </p>
                                )}
                              </div>
                              {(() => {
                                const hasVerifiedSlips = member.paymentSlips?.some(s => s.verified) || member.paymentVerified;
                                const hasPendingSlips = member.paymentSlips?.some(s => !s.verified) || (member.paymentSlipUrl && !member.paymentVerified);
                                if (hasVerifiedSlips) {
                                  return <span className="text-emerald-500 text-xl">✓</span>;
                                } else if (hasPendingSlips) {
                                  return <span className="text-amber-500 text-xl">⚠️</span>;
                                } else {
                                  return <span className="text-gray-300 text-xl">○</span>;
                                }
                              })()}
                            </div>
                            {summary && (() => {
                              const hasVerifiedSlips = member.paymentSlips?.some(s => s.verified) || member.paymentVerified;
                              const hasPendingSlips = member.paymentSlips?.some(s => !s.verified) || (member.paymentSlipUrl && !member.paymentVerified);
                              return (
                                <ProgressBar
                                  value={summary.totalPaid}
                                  max={summary.totalShared}
                                  color={hasVerifiedSlips ? 'emerald' : hasPendingSlips ? 'amber' : 'rose'}
                                  showPercentage={false}
                                />
                              );
                            })()}
                          </div>
                          </div>
                        </Card>
                      </SwipeableCard>
                    );
                  }))}
                </div>
              </div>

              {/* Detail Panel */}
              <div className="lg:col-span-2">
                {selectedMember && selectedMemberSummary ? (
                  <Card className="shadow-lg h-full overflow-y-auto">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg"
                            style={{ backgroundColor: selectedMember.color }}
                          >
                            {selectedMember.name.charAt(0)}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                            <div className="mt-2">
                              {selectedMember.paymentVerified ? (
                                <Badge variant="success">✓ Verified</Badge>
                              ) : selectedMember.paymentSlipUrl ? (
                                <Badge variant="warning">Pending Verification</Badge>
                              ) : (
                                <Badge variant="default">Not Paid</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditMember(selectedMember)}
                            variant="secondary"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteMember(selectedMember)}
                            variant="secondary"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                          <p className="text-sm text-emerald-700 font-medium">Total Paid</p>
                          <p className="text-2xl font-bold text-emerald-900 mt-1">
                            {formatCurrency(selectedMemberSummary.totalPaid)}
                          </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${
                          selectedMemberSummary.balance < 0
                            ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200'
                            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                        }`}>
                          <p className={`text-sm font-medium ${
                            selectedMemberSummary.balance < 0 ? 'text-rose-700' : 'text-green-700'
                          }`}>
                            {selectedMemberSummary.balance < 0 ? 'Owes' : 'Gets Back'}
                          </p>
                          <p className={`text-2xl font-bold mt-1 ${
                            selectedMemberSummary.balance < 0 ? 'text-rose-900' : 'text-green-900'
                          }`}>
                            {formatCurrency(Math.abs(selectedMemberSummary.balance))}
                          </p>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <MemberPaymentMethods
                        member={selectedMember}
                        billId={billId}
                        billPaymentMethods={bill.paymentMethods}
                        onAddPaymentMethod={async (method) => {
                          await addPaymentMethod(billId, method);
                          showToast('Payment method added!', 'success');
                        }}
                        onRemovePaymentMethod={async (index) => {
                          await removePaymentMethod(billId, index);
                          showToast('Payment method removed!', 'success');
                        }}
                      />

                      {/* Payment Slips */}
                      <MemberPaymentSlips
                        member={selectedMember}
                        onVerifySlip={async (slipIndex) => {
                          const updatedSlips = [...(selectedMember.paymentSlips || [])];
                          updatedSlips[slipIndex] = {
                            ...updatedSlips[slipIndex],
                            verified: true,
                          };
                          await updateMember(billId, selectedMember.id, { paymentSlips: updatedSlips });
                          showToast('Payment slip verified!', 'success');
                        }}
                        onRejectSlip={async (slipIndex) => {
                          if (confirm('Remove this payment slip?')) {
                            const updatedSlips = [...(selectedMember.paymentSlips || [])];
                            updatedSlips.splice(slipIndex, 1);
                            await updateMember(billId, selectedMember.id, { paymentSlips: updatedSlips });
                            showToast('Payment slip rejected!', 'info');
                          }
                        }}
                      />

                      {/* Items Involved */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Items Shared</h3>
                        <div className="space-y-2">
                          {bill.items
                            .filter((item) => item.sharedBy.includes(selectedMember.id))
                            .map((item) => (
                              <div key={item.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                <span className="font-medium text-gray-900">{item.name}</span>
                                <span className="text-emerald-600 font-semibold">{formatCurrency(item.price)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Payment Timeline for this member */}
                    {(selectedMember.paymentSlipUrl || selectedMember.paymentVerified) && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <PaymentTimeline bill={{
                          ...bill,
                          members: bill.members.filter(m => m.id === selectedMember.id)
                        }} />
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card className="shadow-lg h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <p className="text-6xl mb-4">👈</p>
                      <p className="text-lg">Select a member to view details</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Items Tab - Split View */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              <TabHeader
                icon="🍽️"
                title="Items"
                count={bill.items.length}
                description="Manage bill items and split details"
                addLabel="Add Item"
                onAdd={() => setShowAddItem(true)}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
              {/* List */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <Card className="shadow-lg">
                  <Input
                    placeholder="🔍 Search items..."
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                  />
                </Card>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredItems.length === 0 ? (
                    <EmptyState
                      icon="🍽️"
                      title={itemSearchQuery ? "No items match your search" : "No items yet"}
                      description={itemSearchQuery
                        ? "Try a different search term"
                        : "Add items to start calculating the bill"}
                      actionLabel="Add First Item"
                      onAction={() => setShowAddItem(true)}
                    />
                  ) : (
                    filteredItems.map((item) => {
                      const isSelected = selectedItemId === item.id;
                      return (
                        <SwipeableCard
                          key={item.id}
                          leftActions={[
                            {
                              id: 'edit',
                              label: 'Edit',
                              icon: '✏️',
                              color: 'text-blue-700',
                              bgColor: 'bg-blue-100',
                              onClick: () => handleEditItem(item),
                            },
                          ]}
                          rightActions={[
                            {
                              id: 'delete',
                              label: 'Delete',
                              icon: '🗑️',
                              color: 'text-rose-700',
                              bgColor: 'bg-rose-100',
                              onClick: () => {
                                if (confirm(`Delete "${item.name}"?`)) {
                                  removeItem(billId, item.id);
                                  setSelectedItemId(null);
                                  showToast('Item deleted!', 'success');
                                }
                              },
                            },
                          ]}
                        >
                          <Card
                            className={`cursor-pointer transition-all group ${
                              isSelected
                                ? 'shadow-lg ring-2 ring-emerald-500 bg-emerald-50'
                                : 'shadow hover:shadow-md'
                            }`}
                            onClick={() => setSelectedItemId(item.id)}
                          >
                            <div className="relative">
                              {/* Desktop actions - top right */}
                              <div className="absolute top-0 right-0 z-10">
                                <CardActions
                                  actions={[
                                    {
                                      icon: '✏️',
                                      label: 'Edit',
                                      onClick: () => handleEditItem(item),
                                      variant: 'primary',
                                    },
                                    {
                                      icon: '🗑️',
                                      label: 'Delete',
                                      onClick: () => {
                                        if (confirm(`Delete "${item.name}"?`)) {
                                          removeItem(billId, item.id);
                                          setSelectedItemId(null);
                                          showToast('Item deleted!', 'success');
                                        }
                                      },
                                      variant: 'danger',
                                    },
                                  ]}
                                />
                              </div>

                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center text-2xl">
                                🍽️
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">{item.name}</p>
                                <p className="text-sm text-emerald-600 font-semibold">
                                  {formatCurrency(item.price)}
                                </p>
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.sharedBy.length} sharing
                              </div>
                            </div>
                            </div>
                          </Card>
                        </SwipeableCard>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Detail Panel */}
              <div className="lg:col-span-2">
                {selectedItem ? (
                  <Card className="shadow-lg h-full overflow-y-auto">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                            🍽️
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                            <p className="text-3xl font-bold text-emerald-600 mt-1">
                              {formatCurrency(selectedItem.price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditItem(selectedItem)}
                            variant="secondary"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm(`Delete "${selectedItem.name}"?`)) {
                                removeItem(billId, selectedItem.id);
                                setSelectedItemId(null);
                                showToast('Item deleted!', 'success');
                              }
                            }}
                            variant="secondary"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                          <p className="text-sm text-emerald-700 font-medium">Price per Person</p>
                          <p className="text-2xl font-bold text-emerald-900 mt-1">
                            {formatCurrency(selectedItem.price / selectedItem.sharedBy.length)}
                          </p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                          <p className="text-sm text-purple-700 font-medium">Total Sharers</p>
                          <p className="text-2xl font-bold text-purple-900 mt-1">
                            {selectedItem.sharedBy.length} {selectedItem.sharedBy.length === 1 ? 'person' : 'people'}
                          </p>
                        </div>
                      </div>

                      {/* Paid By */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Paid By</h3>
                        <div className="space-y-2">
                          {selectedItem.paidBy.map((memberId) => {
                            const member = bill.members.find((m) => m.id === memberId);
                            if (!member) return null;
                            return (
                              <div key={memberId} className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                                  style={{ backgroundColor: member.color }}
                                >
                                  {member.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{member.name}</p>
                                  <p className="text-sm text-gray-600">Paid {formatCurrency(selectedItem.price / selectedItem.paidBy.length)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Shared By */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Shared By</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedItem.sharedBy.map((memberId) => {
                            const member = bill.members.find((m) => m.id === memberId);
                            if (!member) return null;
                            return (
                              <div key={memberId} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                  style={{ backgroundColor: member.color }}
                                >
                                  {member.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">{member.name}</p>
                                  <p className="text-xs text-gray-600">{formatCurrency(selectedItem.price / selectedItem.sharedBy.length)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="shadow-lg h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <p className="text-6xl mb-4">👈</p>
                      <p className="text-lg">Select an item to view details</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <TabHeader
                icon="💳"
                title="Payment Methods"
                count={bill.paymentMethods.length}
                description="Manage ways to receive payments"
                addLabel="Add Payment Method"
                onAdd={() => setShowAddPayment(true)}
              />

              {/* Batch Slip Upload */}
              <BatchSlipUpload
                members={bill.members}
                billId={billId}
                onUploadComplete={async (memberId, imageUrl) => {
                  await updateMember(billId, memberId, { paymentSlipUrl: imageUrl });
                  showToast('Payment slip uploaded!', 'success');
                }}
              />

              <Card className="shadow-lg">
                <Input
                  placeholder="🔍 Search payment methods..."
                  value={paymentSearchQuery}
                  onChange={(e) => setPaymentSearchQuery(e.target.value)}
                />
              </Card>

              {filteredPayments.length === 0 ? (
                <EmptyState
                  icon="💳"
                  title={paymentSearchQuery ? "No payment methods match" : "No payment methods yet"}
                  description={paymentSearchQuery
                    ? "Try a different search term"
                    : "Add payment methods so members can pay you"}
                  actionLabel="Add Payment Method"
                  onAction={() => setShowAddPayment(true)}
                  secondaryLabel={paymentSearchQuery ? "Clear search" : undefined}
                  onSecondary={paymentSearchQuery ? () => setPaymentSearchQuery('') : undefined}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPayments.map((payment, index) => (
                    <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow group relative">
                      {/* Desktop delete button - top right with hover reveal */}
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={() => {
                            if (confirm('Delete this payment method?')) {
                              removePaymentMethod(billId, index);
                              showToast('Payment method deleted!', 'success');
                            }
                          }}
                          className="p-2 rounded-lg bg-rose-100/90 hover:bg-rose-200 text-rose-700 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                          title="Delete payment method"
                        >
                          <span className="text-lg">🗑️</span>
                        </button>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Owner</p>
                        <p className="text-lg font-bold text-gray-900">{payment.ownerName}</p>
                      </div>

                      {payment.type === 'promptpay' && (
                        <div className="bg-emerald-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-emerald-800 mb-1">PromptPay</p>
                          <p className="text-lg font-mono font-bold text-emerald-900">{payment.phoneNumber}</p>
                        </div>
                      )}

                      {payment.type === 'qrcode' && (
                        <div className="bg-teal-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-teal-800 mb-2">QR Code</p>
                          <img
                            src={payment.imageUrl}
                            alt="QR Code"
                            className="w-full rounded-lg border-2 border-teal-200"
                          />
                        </div>
                      )}

                      {payment.type === 'bank' && (
                        <div className="bg-cyan-50 rounded-lg p-4 space-y-2">
                          <p className="text-sm font-medium text-cyan-800">Bank Account</p>
                          <div>
                            <p className="text-xs text-cyan-700">Bank</p>
                            <p className="font-semibold text-cyan-900">{payment.bankName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-cyan-700">Account Number</p>
                            <p className="font-mono font-semibold text-cyan-900">{payment.accountNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-cyan-700">Account Name</p>
                            <p className="font-semibold text-cyan-900">{payment.accountName}</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests Tab - Unified Inbox */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Payment Method Requests */}
              {bill.paymentMethodRequests.filter((r) => r.status === 'pending').length > 0 && (
                <Card className="shadow-lg border-l-4 border-emerald-500">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">💳 Payment Method Requests</h2>
                  <div className="space-y-3">
                    {bill.paymentMethodRequests
                      .filter((r) => r.status === 'pending')
                      .map((request) => (
                        <div key={request.id} className="p-4 bg-emerald-50 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">{request.paymentMethod.ownerName}</p>
                              <p className="text-sm text-gray-600">
                                {request.paymentMethod.type === 'promptpay' && 'PromptPay'}
                                {request.paymentMethod.type === 'qrcode' && 'QR Code'}
                                {request.paymentMethod.type === 'bank' && 'Bank Account'}
                              </p>
                            </div>
                            <Badge variant="warning">Pending</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprovePaymentRequest(request.id)}
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            >
                              ✓ Approve
                            </Button>
                            <Button
                              onClick={() => handleRejectPaymentRequest(request.id)}
                              variant="secondary"
                              size="sm"
                              className="flex-1 text-rose-600 hover:bg-rose-50"
                            >
                              ✗ Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

              {/* Item Opt-out Requests */}
              {bill.requests.filter((r) => r.status === 'pending').length > 0 && (
                <Card className="shadow-lg border-l-4 border-amber-500">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">🍽️ Opt-out Requests</h2>
                  <div className="space-y-3">
                    {bill.requests
                      .filter((r) => r.status === 'pending')
                      .map((request) => {
                        const member = bill.members.find((m) => m.id === request.memberId);
                        const item = bill.items.find((i) => i.id === request.itemId);
                        if (!member || !item) return null;
                        return (
                          <div key={request.id} className="p-4 bg-amber-50 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-600">Wants to opt out from: {item.name}</p>
                                {request.reason && (
                                  <p className="text-sm text-gray-500 mt-1">Reason: {request.reason}</p>
                                )}
                              </div>
                              <Badge variant="warning">Pending</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApproveRequest(request.id)}
                                size="sm"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              >
                                ✓ Approve
                              </Button>
                              <Button
                                onClick={() => handleRejectRequest(request.id)}
                                variant="secondary"
                                size="sm"
                                className="flex-1 text-rose-600 hover:bg-rose-50"
                              >
                                ✗ Reject
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              )}

              {/* Comments */}
              {bill.comments.filter((c) => !c.adminReply).length > 0 && (
                <Card className="shadow-lg border-l-4 border-cyan-500">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">💬 Comments</h2>
                  <div className="space-y-4">
                    {bill.comments
                      .filter((c) => !c.adminReply)
                      .map((comment) => {
                        const member = bill.members.find((m) => m.id === comment.memberId);
                        if (!member) return null;
                        return (
                          <div key={comment.id} className="p-4 bg-cyan-50 rounded-lg">
                            <div className="flex items-start gap-3 mb-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: member.color }}
                              >
                                {member.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-600 mt-1">{comment.message}</p>
                              </div>
                            </div>
                            {replyingToCommentId === comment.id ? (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Type your reply..."
                                  value={commentReply}
                                  onChange={(e) => setCommentReply(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleReplyToComment(comment.id)}
                                    size="sm"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    Send Reply
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setReplyingToCommentId(null);
                                      setCommentReply('');
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => setReplyingToCommentId(comment.id)}
                                variant="secondary"
                                size="sm"
                              >
                                Reply
                              </Button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </Card>
              )}

              {/* All Clear Message */}
              {totalPendingCount === 0 && (
                <Card className="text-center py-12 shadow-lg">
                  <p className="text-6xl mb-4">✅</p>
                  <p className="text-xl font-bold text-gray-900 mb-2">All Clear!</p>
                  <p className="text-gray-600">No pending requests</p>
                </Card>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Bill Templates */}
              <BillTemplates
                bill={bill}
                onApplyTemplate={(memberNames) => {
                  // Add members from template if they don't exist
                  memberNames.forEach((name) => {
                    if (!bill.members.find(m => m.name === name)) {
                      const newMember = {
                        id: generateId(),
                        name,
                        color: getMemberColor(bill.members.length),
                      };
                      addMember(billId, newMember);
                    }
                  });
                  showToast('Template applied successfully!', 'success');
                }}
              />

              {/* Opt-out Deadline */}
              <Card className="shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Opt-out Deadline</h2>
                <p className="text-gray-600 mb-4">
                  Set a deadline for opt-out requests
                </p>
                {bill.optOutDeadline && (
                  <div className="mb-4 p-3 bg-teal-50 rounded-lg">
                    <p className="text-sm text-teal-800">
                      Deadline: {new Date(bill.optOutDeadline).toLocaleString('th-TH')}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Date"
                    type="date"
                    value={optOutDeadlineDate}
                    onChange={(e) => setOptOutDeadlineDate(e.target.value)}
                  />
                  <Input
                    label="Time"
                    type="time"
                    value={optOutDeadlineTime}
                    onChange={(e) => setOptOutDeadlineTime(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSetOptOutDeadline}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    Save
                  </Button>
                  {bill.optOutDeadline && (
                    <Button onClick={handleClearOptOutDeadline} variant="secondary" className="flex-1">
                      Clear
                    </Button>
                  )}
                </div>
              </Card>

              {/* Danger Zone */}
              <Card className="shadow-lg border-2 border-rose-200">
                <h2 className="text-xl font-bold text-rose-600 mb-4">⚠️ Danger Zone</h2>
                <p className="text-gray-600 mb-4">
                  Deleting the bill cannot be undone
                </p>
                <Button
                  onClick={handleDeleteBill}
                  variant="secondary"
                  className="w-full sm:w-auto bg-rose-600 text-white hover:bg-rose-700"
                >
                  🗑️ Delete Bill
                </Button>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <FAB actions={fabActions} />

      {/* Command Palette */}
      <CommandPalette commands={commands} />

      {/* Bottom Navigation (Mobile) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={totalPendingCount}
      />

      {/* Modals - Same as before */}
      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMember}
        onClose={() => {
          setShowAddMember(false);
          setMemberName('');
          setEditingMemberId(null);
        }}
        title={editingMemberId ? 'Edit Member' : 'Add New Member'}
      >
        <div className="space-y-4">
          <Input
            label="Member Name"
            placeholder="e.g. John, Mary"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={handleAddMember} fullWidth className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              {editingMemberId ? 'Save' : 'Add Member'}
            </Button>
            <Button
              onClick={() => {
                setShowAddMember(false);
                setMemberName('');
                setEditingMemberId(null);
              }}
              variant="secondary"
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal - Multi-step Wizard */}
      <Modal
        isOpen={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          setItemName('');
          setItemPrice('');
          setSelectedPayers([]);
          setSelectedShared([]);
          setEditingItemId(null);
          setItemWizardStep(1);
        }}
        title={editingItemId ? 'Edit Item' : 'Add New Item'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    itemWizardStep >= step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 ${
                      itemWizardStep > step ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Item Details */}
          {itemWizardStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
              <Input
                label="Item Name"
                placeholder="e.g. Steak, Pizza"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                autoFocus
              />
              <Input
                label="Price (฿)"
                type="number"
                placeholder="0"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
              <Button
                onClick={() => setItemWizardStep(2)}
                fullWidth
                disabled={!itemName.trim() || !itemPrice}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                Next →
              </Button>
            </div>
          )}

          {/* Step 2: Who Paid */}
          {itemWizardStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Who paid?</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAllMembers(setSelectedPayers)}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => deselectAllMembers(setSelectedPayers)}
                    className="text-sm text-rose-600 hover:text-rose-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {bill.members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleMemberSelection(member.id, selectedPayers, setSelectedPayers)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedPayers.includes(member.id)
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: member.color }}
                      />
                      <span className="font-medium text-gray-900">{member.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setItemWizardStep(1)} variant="secondary" fullWidth>
                  ← Back
                </Button>
                <Button
                  onClick={() => setItemWizardStep(3)}
                  fullWidth
                  disabled={selectedPayers.length === 0}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Who Shared */}
          {itemWizardStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Who's sharing?</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAllMembers(setSelectedShared)}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => deselectAllMembers(setSelectedShared)}
                    className="text-sm text-rose-600 hover:text-rose-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Quick Split Options */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => {
                    selectAllMembers(setSelectedShared);
                    setQuickSplitMode('equal');
                  }}
                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                    quickSplitMode === 'equal'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">⚖️</div>
                  <div className="text-xs font-semibold text-gray-900">Split All</div>
                </button>
                <button
                  onClick={() => {
                    // Select payers only
                    setSelectedShared(selectedPayers);
                    setQuickSplitMode('common');
                  }}
                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                    quickSplitMode === 'common'
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">👥</div>
                  <div className="text-xs font-semibold text-gray-900">Payers Only</div>
                </button>
                <button
                  onClick={() => {
                    deselectAllMembers(setSelectedShared);
                    setQuickSplitMode('custom');
                  }}
                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                    quickSplitMode === 'custom'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">✏️</div>
                  <div className="text-xs font-semibold text-gray-900">Custom</div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {bill.members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleMemberSelection(member.id, selectedShared, setSelectedShared)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedShared.includes(member.id)
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: member.color }}
                      />
                      <span className="font-medium text-gray-900">{member.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setItemWizardStep(2)} variant="secondary" fullWidth>
                  ← Back
                </Button>
                <Button
                  onClick={handleAddItem}
                  fullWidth
                  disabled={selectedShared.length === 0}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {editingItemId ? 'Save' : 'Add Item'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={showAddPayment}
        onClose={() => {
          setShowAddPayment(false);
          setPaymentOwnerId('');
          setPromptPayPhone('');
          setQrcodeFile(null);
          setQrcodePreview('');
          setBankName('');
          setAccountNumber('');
          setAccountName('');
        }}
        title="Add Payment Method"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Owner
            </label>
            <select
              value={paymentOwnerId}
              onChange={(e) => setPaymentOwnerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">-- Select Member --</option>
              {bill.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentType('promptpay')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentType === 'promptpay'
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm">PromptPay</p>
              </button>
              <button
                onClick={() => setPaymentType('qrcode')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentType === 'qrcode'
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm">QR Code</p>
              </button>
              <button
                onClick={() => setPaymentType('bank')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentType === 'bank'
                    ? 'border-cyan-600 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm">Bank</p>
              </button>
            </div>
          </div>

          {paymentType === 'promptpay' && (
            <Input
              label="PromptPay Phone Number"
              placeholder="0812345678"
              value={promptPayPhone}
              onChange={(e) => setPromptPayPhone(e.target.value)}
            />
          )}

          {paymentType === 'qrcode' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload QR Code
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQRFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {qrcodePreview && (
                <img
                  src={qrcodePreview}
                  alt="Preview"
                  className="mt-4 w-48 h-48 object-cover rounded-lg border-2 border-teal-200"
                />
              )}
            </div>
          )}

          {paymentType === 'bank' && (
            <div className="space-y-4">
              <Input
                label="Bank Name"
                placeholder="e.g. Kasikorn Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
              <Input
                label="Account Number"
                placeholder="1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
              <Input
                label="Account Name"
                placeholder="Mr./Mrs. Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAddPaymentMethod}
              fullWidth
              disabled={isUploading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isUploading ? 'Uploading...' : 'Add Payment Method'}
            </Button>
            <Button
              onClick={() => {
                setShowAddPayment(false);
                setPaymentOwnerId('');
                setPromptPayPhone('');
                setQrcodeFile(null);
                setQrcodePreview('');
                setBankName('');
                setAccountNumber('');
                setAccountName('');
              }}
              variant="secondary"
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Link Modal */}
      <Modal
        isOpen={showShareLink}
        onClose={() => setShowShareLink(false)}
        title="Share Bill Link"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={memberLink}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(memberLink);
                  showToast('Link copied!', 'success');
                }}
                size="sm"
              >
                Copy
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Share this link with members to view balances
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Code
            </label>
            <div className="px-4 py-3 bg-emerald-50 rounded-lg border-2 border-emerald-200">
              <p className="text-center font-mono font-bold text-2xl text-emerald-700">
                {bill.adminId}
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Use this code to access admin panel
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
