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

  const steps = [
    { id: 'basic', name: 'ข้อมูลพื้นฐาน', icon: '📝' },
    { id: 'members', name: 'สมาชิก', icon: '👥' },
    { id: 'payment', name: 'การรับเงิน', icon: '💰' },
    { id: 'items', name: 'รายการอาหาร', icon: '🍽️' },
    { id: 'summary', name: 'สรุป', icon: '✅' },
  ];

  const handleAddMember = () => {
    if (memberName.trim()) {
      const newMember: Member = {
        id: generateId(),
        name: memberName.trim(),
        color: getMemberColor(members.length),
      };
      setMembers([...members, newMember]);
      setMemberName('');
    }
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
      const newItem: BillItem = {
        id: generateId(),
        name: itemName.trim(),
        price: parseFloat(itemPrice),
        paidBy: selectedPayers,
        sharedBy: selectedShared,
      };
      setItems([...items, newItem]);
      setItemName('');
      setItemPrice('');
      setSelectedPayers([]);
      setSelectedShared([]);
    }
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
    <div className="min-h-screen bg-white dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">สร้างบิลใหม่</h1>
          <p className="text-gray-600 dark:text-gray-400">กรอกข้อมูลเพื่อสร้างบิลแชร์ค่าใช้จ่าย</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;

              return (
                <div key={step.id} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <p
                      className={`text-xs mt-2 hidden sm:block ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="mb-6 border-2">
          {/* Step 1: Basic Info */}
          {currentStep === 'basic' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ข้อมูลพื้นฐาน</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">เพิ่มสมาชิก</h2>

              <div className="flex gap-2">
                <Input
                  placeholder="ชื่อสมาชิก"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                />
                <Button onClick={handleAddMember} disabled={!memberName.trim()}>
                  เพิ่ม
                </Button>
              </div>

              {members.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    สมาชิกทั้งหมด ({members.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full"
                            style={{ backgroundColor: member.color }}
                          />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {members.length < 2 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  ⚠️ ต้องมีสมาชิกอย่างน้อย 2 คนเพื่อดำเนินการต่อ
                </p>
              )}
            </div>
          )}

          {/* Step 3: Payment Methods */}
          {currentStep === 'payment' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">วิธีการรับเงิน</h2>

              <div className="space-y-4">
                {/* Select Owner */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    เจ้าของบัญชี
                  </label>
                  <select
                    value={paymentOwnerId}
                    onChange={(e) => setPaymentOwnerId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    วิธีการรับเงินที่เพิ่มแล้ว
                  </p>
                  {paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="default">{method.ownerName}</Badge>
                          {method.type === 'promptpay' && <Badge variant="info">พร้อมเพย์</Badge>}
                          {method.type === 'qrcode' && <Badge variant="success">QR Code</Badge>}
                          {method.type === 'bank' && <Badge variant="warning">บัญชีธนาคาร</Badge>}
                        </div>
                        {method.type === 'promptpay' && (
                          <p className="text-gray-700 dark:text-gray-300">{method.phoneNumber}</p>
                        )}
                        {method.type === 'qrcode' && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm">{method.imageUrl}</p>
                        )}
                        {method.type === 'bank' && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {method.bankName} - {method.accountNumber} ({method.accountName})
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setPaymentMethods(paymentMethods.filter((_, i) => i !== index))
                        }
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Items */}
          {currentStep === 'items' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">เพิ่มรายการอาหาร</h2>

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
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ใครจ่ายเงิน?
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => toggleMemberSelection(member.id, selectedPayers, setSelectedPayers)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          selectedPayers.includes(member.id)
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: member.color }} />
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        className={`p-2 rounded-lg border-2 transition-all ${
                          selectedShared.includes(member.id)
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: member.color }} />
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

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
                  เพิ่มรายการ
                </Button>
              </div>

              {items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    รายการทั้งหมด ({items.length})
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </h4>
                            <p className="text-lg text-blue-600 dark:text-blue-400 font-bold">
                              ฿{item.price.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>
                            💳 จ่ายโดย:{' '}
                            {item.paidBy
                              .map((id) => members.find((m) => m.id === id)?.name)
                              .join(', ')}
                          </p>
                          <p>
                            🍴 หารกัน:{' '}
                            {item.sharedBy
                              .map((id) => members.find((m) => m.id === id)?.name)
                              .join(', ')}
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">สรุปข้อมูล</h2>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    ชื่อบิล: {billName}
                  </h3>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    สมาชิก ({members.length} คน)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <Badge key={member.id}>{member.name}</Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    วิธีการรับเงิน ({paymentMethods.length})
                  </h3>
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      {method.ownerName} - {method.type === 'promptpay' && 'พร้อมเพย์'}
                      {method.type === 'qrcode' && 'QR Code'}
                      {method.type === 'bank' && 'บัญชีธนาคาร'}
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    รายการอาหาร ({items.length} รายการ)
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    รวม ฿{items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                  </p>
                </div>

                <div className="pt-4">
                  <Button onClick={handleCreateBill} size="lg" fullWidth>
                    สร้างบิลและไปหน้า Admin 🎉
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
