'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useBill } from '@/context/BillContext';
import { Member, PaymentMethod, BillItem } from '@/types';
import { generateId, generateAdminCode, getMemberColor } from '@/lib/calculations';

type Step = 'basic' | 'members' | 'payment' | 'items' | 'summary';

export default function CreateBillPage() {
  const router = useRouter();
  const { createBill, addMember, addPaymentMethod, addItem } = useBill();

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [billName, setBillName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [items, setItems] = useState<BillItem[]>([]);

  // Temporary form state
  const [memberName, setMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'promptpay' | 'qrcode' | 'bank'>('promptpay');
  const [paymentOwnerId, setPaymentOwnerId] = useState('');
  const [promptPayPhone, setPromptPayPhone] = useState('');
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [selectedPayers, setSelectedPayers] = useState<string[]>([]);
  const [selectedShared, setSelectedShared] = useState<string[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const steps = [
    { id: 'basic', name: 'ข้อมูลพื้นฐาน', icon: '📝' },
    { id: 'members', name: 'สมาชิก', icon: '👥' },
    { id: 'payment', name: 'การรับเงิน', icon: '💰' },
    { id: 'items', name: 'รายการอาหาร', icon: '🍽️' },
    { id: 'summary', name: 'สรุป', icon: '✅' },
  ];

  const handleAddMember = () => {
    if (memberName.trim()) {
      if (editingMemberId) {
        // Update existing member
        setMembers(members.map((m) =>
          m.id === editingMemberId ? { ...m, name: memberName.trim() } : m
        ));
        setEditingMemberId(null);
      } else {
        // Add new member
        const newMember: Member = {
          id: generateId(),
          name: memberName.trim(),
          color: getMemberColor(members.length),
        };
        setMembers([...members, newMember]);
      }
      setMemberName('');
    }
  };

  const handleEditMember = (member: Member) => {
    setMemberName(member.name);
    setEditingMemberId(member.id);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleAddPaymentMethod = () => {
    if (!paymentOwnerId) {
      alert('กรุณาเลือกเจ้าของบัญชี');
      return;
    }

    const owner = members.find((m) => m.id === paymentOwnerId);
    if (!owner) return;

    let newMethod: PaymentMethod | null = null;

    if (paymentType === 'promptpay' && promptPayPhone.trim()) {
      newMethod = {
        type: 'promptpay',
        phoneNumber: promptPayPhone.trim(),
        ownerId: paymentOwnerId,
        ownerName: owner.name,
      };
      setPromptPayPhone('');
    } else if (paymentType === 'qrcode' && qrcodeUrl.trim()) {
      newMethod = {
        type: 'qrcode',
        imageUrl: qrcodeUrl.trim(),
        ownerId: paymentOwnerId,
        ownerName: owner.name,
      };
      setQrcodeUrl('');
    } else if (paymentType === 'bank' && bankName.trim() && accountNumber.trim() && accountName.trim()) {
      newMethod = {
        type: 'bank',
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        ownerId: paymentOwnerId,
        ownerName: owner.name,
      };
      setBankName('');
      setAccountNumber('');
      setAccountName('');
    }

    if (newMethod) {
      setPaymentMethods([...paymentMethods, newMethod]);
      setPaymentOwnerId('');
    }
  };

  const handleAddItem = () => {
    if (itemName.trim() && itemPrice && selectedPayers.length > 0 && selectedShared.length > 0) {
      if (editingItemId) {
        // Update existing item
        setItems(items.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                name: itemName.trim(),
                price: parseFloat(itemPrice),
                paidBy: selectedPayers,
                sharedBy: selectedShared,
              }
            : item
        ));
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
        setItems([...items, newItem]);
      }
      setItemName('');
      setItemPrice('');
      setSelectedPayers([]);
      setSelectedShared([]);
    }
  };

  const handleEditItem = (item: BillItem) => {
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setSelectedPayers(item.paidBy);
    setSelectedShared(item.sharedBy);
    setEditingItemId(item.id);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const toggleMemberSelection = (memberId: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(memberId)) {
      setter(list.filter((id) => id !== memberId));
    } else {
      setter([...list, memberId]);
    }
  };

  const selectAllMembers = (setter: (list: string[]) => void) => {
    setter(members.map((m) => m.id));
  };

  const deselectAllMembers = (setter: (list: string[]) => void) => {
    setter([]);
  };

  const handleCreateBill = async () => {
    try {
      const adminId = generateAdminCode();
      const bill = await createBill(billName, adminId);

      // Add all members
      for (const member of members) {
        await addMember(bill.id, member);
      }

      // Add all payment methods
      for (const method of paymentMethods) {
        await addPaymentMethod(bill.id, method);
      }

      // Add all items
      for (const item of items) {
        await addItem(bill.id, item);
      }

      // Navigate to admin dashboard
      router.push(`/bill/${bill.id}/admin?code=${adminId}`);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('เกิดข้อผิดพลาดในการสร้างบิล กรุณาลองใหม่อีกครั้ง\n\nหากปัญหายังคงอยู่ ให้ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return billName.trim().length > 0;
      case 'members':
        return members.length >= 2;
      case 'payment':
        return paymentMethods.length > 0;
      case 'items':
        return items.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            สร้างบิลใหม่
          </h1>
          <p className="text-gray-600 text-lg">กรอกข้อมูลเพื่อสร้างบิลแชร์ค่าใช้จ่าย</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;

              return (
                <div key={step.id} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-110'
                          : isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                          : 'bg-white border-2 border-gray-200 text-gray-400 shadow-sm'
                      }`}
                    >
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    <p
                      className={`text-xs mt-2 font-semibold hidden sm:block transition-colors ${
                        isActive
                          ? 'text-indigo-600'
                          : isCompleted
                          ? 'text-emerald-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="mb-8 shadow-lg">
          {/* Step 1: Basic Info */}
          {currentStep === 'basic' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">ข้อมูลพื้นฐาน</h2>
                <p className="text-gray-600">เริ่มต้นด้วยการตั้งชื่อบิลของคุณ</p>
              </div>
              <Input
                label="ชื่อปาร์ตี้/บิล"
                placeholder="เช่น งานเลี้ยงวันเกิด, ทานข้าวกลุ่ม"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Members */}
          {currentStep === 'members' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">เพิ่มสมาชิก</h2>
                <p className="text-gray-600">ใครบ้างที่จะร่วมแชร์ค่าใช้จ่ายในครั้งนี้?</p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="ชื่อสมาชิก"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                />
                <Button onClick={handleAddMember} disabled={!memberName.trim()}>
                  {editingMemberId ? 'บันทึก' : 'เพิ่ม'}
                </Button>
                {editingMemberId && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingMemberId(null);
                      setMemberName('');
                    }}
                  >
                    ยกเลิก
                  </Button>
                )}
              </div>

              {members.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-900">
                    สมาชิกทั้งหมด ({members.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full shadow-sm"
                            style={{ backgroundColor: member.color }}
                          />
                          <span className="font-semibold text-gray-900">
                            {member.name}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {members.length < 2 && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-900">ต้องมีสมาชิกอย่างน้อย 2 คน</p>
                    <p className="text-sm text-amber-700">เพิ่มสมาชิกอีก {2 - members.length} คนเพื่อดำเนินการต่อ</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Payment Methods */}
          {currentStep === 'payment' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">วิธีการรับเงิน</h2>
                <p className="text-gray-600">เพิ่มช่องทางการชำระเงินของคุณ</p>
              </div>

              <div className="space-y-4">
                {/* Select Owner */}
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
                    {members.map((member) => (
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
                  <div className="flex gap-2">
                    <Input
                      placeholder="เบอร์โทรศัพท์พร้อมเพย์"
                      value={promptPayPhone}
                      onChange={(e) => setPromptPayPhone(e.target.value)}
                    />
                    <Button onClick={handleAddPaymentMethod} disabled={!promptPayPhone.trim() || !paymentOwnerId}>
                      เพิ่ม
                    </Button>
                  </div>
                )}

                {paymentType === 'qrcode' && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL ของ QR Code"
                      value={qrcodeUrl}
                      onChange={(e) => setQrcodeUrl(e.target.value)}
                    />
                    <Button onClick={handleAddPaymentMethod} disabled={!qrcodeUrl.trim() || !paymentOwnerId}>
                      เพิ่ม
                    </Button>
                  </div>
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
                    <Button
                      onClick={handleAddPaymentMethod}
                      fullWidth
                      disabled={!bankName.trim() || !accountNumber.trim() || !accountName.trim() || !paymentOwnerId}
                    >
                      เพิ่ม
                    </Button>
                  </div>
                )}
              </div>

              {paymentMethods.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-900">
                    วิธีการรับเงินที่เพิ่มแล้ว ({paymentMethods.length})
                  </p>
                  <div className="space-y-2">
                    {paymentMethods.map((method, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 flex justify-between items-center shadow-sm hover:shadow-md transition-all"
                      >
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
                          onClick={() =>
                            setPaymentMethods(paymentMethods.filter((_, i) => i !== index))
                          }
                          className="w-8 h-8 rounded-lg flex items-center justify-center ml-3 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Items */}
          {currentStep === 'items' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">เพิ่มรายการอาหาร</h2>
                <p className="text-gray-600">บันทึกรายการที่สั่งและผู้ที่เกี่ยวข้อง</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="ชื่อเมนู"
                  placeholder="เช่น ข้าวผัด, ส้มตำ"
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
                  <p className="text-sm font-bold text-gray-900 mb-3">
                    ใครจ่ายเงิน?
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {members.map((member) => (
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
                          <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: member.color }} />
                          <span className="text-sm font-bold text-gray-900">{member.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {members.map((member) => (
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
                          <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: member.color }} />
                          <span className="text-sm font-bold text-gray-900">{member.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddItem}
                    fullWidth
                    disabled={
                      !itemName.trim() ||
                      !itemPrice ||
                      selectedPayers.length === 0 ||
                      selectedShared.length === 0
                    }
                  >
                    {editingItemId ? 'บันทึกรายการ' : 'เพิ่มรายการ'}
                  </Button>
                  {editingItemId && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingItemId(null);
                        setItemName('');
                        setItemPrice('');
                        setSelectedPayers([]);
                        setSelectedShared([]);
                      }}
                    >
                      ยกเลิก
                    </Button>
                  )}
                </div>
              </div>

              {items.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-900">
                    รายการทั้งหมด ({items.length})
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">
                              {item.name}
                            </h4>
                            <p className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                              ฿{item.price.toFixed(2)}
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
                              onClick={() => handleRemoveItem(item.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">💳 จ่ายโดย:</span>
                            <span>
                              {item.paidBy
                                .map((id) => members.find((m) => m.id === id)?.name)
                                .join(', ')}
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">🍴 หารกัน:</span>
                            <span>
                              {item.sharedBy
                                .map((id) => members.find((m) => m.id === id)?.name)
                                .join(', ')}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Summary */}
          {currentStep === 'summary' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">สรุปข้อมูล</h2>
                <p className="text-gray-600">ตรวจสอบข้อมูลก่อนสร้างบิล</p>
              </div>

              <div className="space-y-4">
                <Card padding="md" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl">
                      📝
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">ชื่อบิล</p>
                      <h3 className="text-xl font-bold text-gray-900">
                        {billName}
                      </h3>
                    </div>
                  </div>
                </Card>

                <Card padding="md" className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white text-2xl">
                        👥
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">สมาชิก</p>
                        <h3 className="text-xl font-bold text-gray-900">
                          {members.length} คน
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: member.color }} />
                        <span className="text-sm font-semibold text-gray-900">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="md" className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center text-white text-2xl">
                      💰
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">วิธีการรับเงิน</p>
                      <h3 className="text-xl font-bold text-gray-900">
                        {paymentMethods.length} ช่องทาง
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {paymentMethods.map((method, index) => (
                      <div key={index} className="text-sm bg-white px-3 py-2 rounded-lg shadow-sm">
                        <span className="font-semibold text-gray-900">{method.ownerName}</span>
                        <span className="text-gray-600"> - </span>
                        {method.type === 'promptpay' && <span className="text-gray-600">พร้อมเพย์</span>}
                        {method.type === 'qrcode' && <span className="text-gray-600">QR Code</span>}
                        {method.type === 'bank' && <span className="text-gray-600">บัญชีธนาคาร</span>}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="md" className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 flex items-center justify-center text-white text-2xl">
                        🍽️
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">รายการอาหาร</p>
                        <h3 className="text-xl font-bold text-gray-900">
                          {items.length} รายการ
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-600">ยอดรวม</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                        ฿{items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="pt-4">
                  <Button onClick={handleCreateBill} size="lg" fullWidth>
                    สร้างบิลและไปหน้า Admin
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStep !== 'basic' && (
            <Button
              variant="secondary"
              onClick={() => {
                const currentIndex = steps.findIndex((s) => s.id === currentStep);
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1].id as Step);
                }
              }}
            >
              ← ย้อนกลับ
            </Button>
          )}

          {currentStep !== 'summary' && (
            <Button
              onClick={() => {
                const currentIndex = steps.findIndex((s) => s.id === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id as Step);
                }
              }}
              disabled={!canProceed()}
              fullWidth
            >
              ถัดไป →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
