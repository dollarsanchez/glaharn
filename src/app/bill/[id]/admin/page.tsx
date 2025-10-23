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
import { BillItem, Member } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const billId = params.id as string;
  const adminCode = searchParams.get('code');

  const { bills, loadBill, addMember, removeMember, addItem, updateItem, removeItem } = useBill();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCode, setAuthCode] = useState('');

  // Modals state
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  // Form state
  const [memberName, setMemberName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [selectedPayers, setSelectedPayers] = useState<string[]>([]);
  const [selectedShared, setSelectedShared] = useState<string[]>([]);

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
      const newMember: Member = {
        id: generateId(),
        name: memberName.trim(),
        color: getMemberColor(bill.members.length),
      };
      addMember(billId, newMember);
      setMemberName('');
      setShowAddMember(false);
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
      addItem(billId, newItem);
      setItemName('');
      setItemPrice('');
      setSelectedPayers([]);
      setSelectedShared([]);
      setShowAddItem(false);
    }
  };

  const memberLink = typeof window !== 'undefined' ? `${window.location.origin}/bill/${billId}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <span className="font-semibold">Admin</span>
                </div>
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full font-mono font-bold">
                  {bill.adminId}
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-2">{bill.name}</h1>
              <p className="text-indigo-100 text-lg">
                {bill.members.length} สมาชิก • {bill.items.length} รายการ
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowShareLink(true)}
                className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
              >
                📤 แชร์ลิงก์
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-indigo-100 mb-1">ยอดรวมทั้งหมด</p>
              <p className="text-4xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-indigo-100 mb-1">รายการทั้งหมด</p>
              <p className="text-4xl font-bold">{bill.items.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-indigo-100 mb-1">สมาชิก</p>
              <p className="text-4xl font-bold">{bill.members.length}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Members & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Members */}
            <Card className="shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    👥 สมาชิก
                  </h2>
                  <p className="text-gray-600">จัดการสมาชิกในบิล</p>
                </div>
                <Button size="sm" onClick={() => setShowAddMember(true)}>
                  + เพิ่ม
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bill.members.map((member) => {
                  const memberSummary = summaries.find((s) => s.memberId === member.id);
                  return (
                    <div
                      key={member.id}
                      className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
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
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Items */}
            <Card className="shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    🍽️ รายการอาหาร
                  </h2>
                  <p className="text-gray-600">จัดการรายการในบิล</p>
                </div>
                <Button size="sm" onClick={() => setShowAddItem(true)}>
                  + เพิ่ม
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

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="shadow-lg">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  📊 สรุปยอด
                </h2>
                <p className="text-gray-600">ยอดสุทธิของแต่ละคน</p>
              </div>
              <div className="space-y-3">
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
              <div className="space-y-3">
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
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title="เพิ่มสมาชิก"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddMember(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAddMember} disabled={!memberName.trim()}>
              เพิ่ม
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

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          setItemName('');
          setItemPrice('');
          setSelectedPayers([]);
          setSelectedShared([]);
        }}
        title="เพิ่มรายการอาหาร"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddItem(false)}>
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
              เพิ่มรายการ
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
            <p className="text-sm font-bold text-gray-900 mb-2">
              ใครกิน? (หารกัน)
            </p>
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
