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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="text-center max-w-md w-full">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ไม่พบบิลนี้
          </h1>
          <Button onClick={() => router.push('/')}>กลับหน้าหลัก</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Access
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              กรุณากรอกรหัส Admin เพื่อเข้าถึงหน้านี้
            </p>
          </div>
          <Input
            placeholder="รหัส Admin (6 ตัวอักษร)"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
            maxLength={6}
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
            className="mt-4"
          >
            เข้าสู่ระบบ
          </Button>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-br from-violet-600 to-indigo-700 border-none text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white">👑 Admin</Badge>
                <Badge className="bg-white/20 text-white font-mono">{bill.adminId}</Badge>
              </div>
              <h1 className="text-3xl font-bold">{bill.name}</h1>
              <p className="text-violet-100 mt-1">
                {bill.members.length} สมาชิก • {bill.items.length} รายการ
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowShareLink(true)}
                className="bg-white text-violet-700 hover:bg-gray-100"
              >
                📤 แชร์ลิงก์
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            <div>
              <p className="text-sm text-violet-200">ยอดรวมทั้งหมด</p>
              <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-violet-200">รายการทั้งหมด</p>
              <p className="text-3xl font-bold">{bill.items.length}</p>
            </div>
            <div>
              <p className="text-sm text-violet-200">สมาชิก</p>
              <p className="text-3xl font-bold">{bill.members.length}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Members & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Members */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  👥 สมาชิก ({bill.members.length})
                </h2>
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
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg group hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                          {member.name}
                        </span>
                      </div>
                      {memberSummary && (
                        <div className="text-xs">
                          <p className={memberSummary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
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
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  🍽️ รายการอาหาร ({bill.items.length})
                </h2>
                <Button size="sm" onClick={() => setShowAddItem(true)}>
                  + เพิ่ม
                </Button>
              </div>
              <div className="space-y-2">
                {bill.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-lg text-violet-600 dark:text-violet-400 font-bold">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('ยืนยันการลบรายการนี้?')) {
                            removeItem(billId, item.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        💳 จ่ายโดย:{' '}
                        {item.paidBy.map((id) => bill.members.find((m) => m.id === id)?.name).join(', ')}
                      </p>
                      <p>
                        🍴 หารกัน:{' '}
                        {item.sharedBy.map((id) => bill.members.find((m) => m.id === id)?.name).join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📊 สรุปยอด
              </h2>
              <div className="space-y-3">
                {summaries.map((summary) => (
                  <div
                    key={summary.memberId}
                    className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{
                            backgroundColor: bill.members.find((m) => m.id === summary.memberId)?.color,
                          }}
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {summary.memberName}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          summary.balance >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {summary.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary.balance))}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <p>หาร: {formatCurrency(summary.totalShared)}</p>
                      <p>จ่าย: {formatCurrency(summary.totalPaid)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Transactions */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                💸 รายการโอนเงิน
              </h2>
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-lg border border-violet-200 dark:border-violet-800"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction.fromName} → {transaction.toName}
                    </p>
                    <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
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
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ใครจ่ายเงิน?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {bill.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleMemberSelection(member.id, selectedPayers, setSelectedPayers)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    selectedPayers.includes(member.id)
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                      : 'border-gray-200 dark:border-gray-700'
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
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ใครกิน? (หารกัน)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {bill.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleMemberSelection(member.id, selectedShared, setSelectedShared)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    selectedShared.includes(member.id)
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'border-gray-200 dark:border-gray-700'
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
          <p className="text-gray-600 dark:text-gray-400">
            ส่งลิงก์นี้ให้สมาชิกเพื่อให้พวกเขาเข้ามาดูข้อมูลและยอดเงินที่ต้องจ่าย
          </p>
          <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
              {memberLink}
            </p>
          </div>
          <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
            <p className="text-sm font-medium text-violet-900 dark:text-violet-300 mb-2">
              🔐 รหัส Admin ของคุณ:
            </p>
            <p className="text-2xl font-bold font-mono text-violet-600 dark:text-violet-400">
              {bill.adminId}
            </p>
            <p className="text-xs text-violet-700 dark:text-violet-400 mt-2">
              เก็บรหัสนี้ไว้เพื่อเข้าหน้า Admin ในครั้งถัดไป
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
