'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { PaymentMethod, Member } from '@/types';
import { uploadQRCode, validateImageFile } from '@/lib/storage';

interface MemberPaymentMethodsProps {
  member: Member;
  billId: string;
  billPaymentMethods: PaymentMethod[];
  onAddPaymentMethod: (method: PaymentMethod) => Promise<void>;
  onRemovePaymentMethod: (index: number) => Promise<void>;
}

export default function MemberPaymentMethods({
  member,
  billId,
  billPaymentMethods,
  onAddPaymentMethod,
  onRemovePaymentMethod,
}: MemberPaymentMethodsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'promptpay' | 'qrcode' | 'bank'>('promptpay');
  const [promptPayPhone, setPromptPayPhone] = useState('');
  const [qrcodeFile, setQrcodeFile] = useState<File | null>(null);
  const [qrcodePreview, setQrcodePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Filter payment methods ที่เป็นของ member คนนี้
  const memberPaymentMethods = billPaymentMethods.filter(
    (pm) => pm.ownerId === member.id
  );

  const resetForm = () => {
    setPaymentType('promptpay');
    setPromptPayPhone('');
    setQrcodeFile(null);
    setQrcodePreview('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
  };

  const handleQRCodeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      alert(error);
      return;
    }

    setQrcodeFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrcodePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPaymentMethod = async () => {
    try {
      setIsUploading(true);
      let newMethod: PaymentMethod;

      if (paymentType === 'promptpay') {
        if (!promptPayPhone.trim()) {
          alert('Please enter PromptPay phone number');
          return;
        }
        newMethod = {
          type: 'promptpay',
          phoneNumber: promptPayPhone.trim(),
          ownerId: member.id,
          ownerName: member.name,
        };
      } else if (paymentType === 'qrcode') {
        if (!qrcodeFile) {
          alert('Please select a QR code image');
          return;
        }
        const imageUrl = await uploadQRCode(qrcodeFile, billId);
        newMethod = {
          type: 'qrcode',
          imageUrl,
          ownerId: member.id,
          ownerName: member.name,
        };
      } else {
        if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
          alert('Please fill all bank account fields');
          return;
        }
        newMethod = {
          type: 'bank',
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          ownerId: member.id,
          ownerName: member.name,
        };
      }

      await onAddPaymentMethod(newMethod);
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Failed to add payment method');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePaymentMethod = async (methodIndex: number) => {
    if (confirm('Remove this payment method?')) {
      const globalIndex = billPaymentMethods.findIndex(
        (pm) => pm === memberPaymentMethods[methodIndex]
      );
      await onRemovePaymentMethod(globalIndex);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Payment Methods
          {memberPaymentMethods.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({memberPaymentMethods.length})
            </span>
          )}
        </h3>
        <Button
          onClick={() => setShowAddModal(true)}
          size="sm"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          + Add Method
        </Button>
      </div>

      {memberPaymentMethods.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-4xl mb-2">💳</p>
          <p className="text-gray-600 text-sm">No payment methods yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memberPaymentMethods.map((method, idx) => (
            <Card key={idx} className="bg-gradient-to-br from-white to-gray-50 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {method.type === 'promptpay' && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center text-2xl">
                        📱
                      </div>
                      <div>
                        <Badge variant="default" className="mb-1">PromptPay</Badge>
                        <p className="font-mono text-lg font-semibold text-gray-900">
                          {method.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  {method.type === 'qrcode' && (
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center text-2xl">
                        📷
                      </div>
                      <div className="flex-1">
                        <Badge variant="default" className="mb-2">QR Code</Badge>
                        <img
                          src={method.imageUrl}
                          alt="QR Code"
                          className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {method.type === 'bank' && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center text-2xl">
                        🏦
                      </div>
                      <div>
                        <Badge variant="default" className="mb-1">{method.bankName}</Badge>
                        <p className="font-mono text-sm font-semibold text-gray-900">
                          {method.accountNumber}
                        </p>
                        <p className="text-sm text-gray-600">{method.accountName}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleRemovePaymentMethod(idx)}
                  variant="secondary"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={`Add Payment Method for ${member.name}`}
      >
        <div className="space-y-4">
          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentType('promptpay')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === 'promptpay'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">📱</div>
                <div className="text-xs font-semibold">PromptPay</div>
              </button>
              <button
                onClick={() => setPaymentType('qrcode')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === 'qrcode'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">📷</div>
                <div className="text-xs font-semibold">QR Code</div>
              </button>
              <button
                onClick={() => setPaymentType('bank')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentType === 'bank'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">🏦</div>
                <div className="text-xs font-semibold">Bank</div>
              </button>
            </div>
          </div>

          {/* PromptPay Form */}
          {paymentType === 'promptpay' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="0812345678"
                value={promptPayPhone}
                onChange={(e) => setPromptPayPhone(e.target.value)}
              />
            </div>
          )}

          {/* QR Code Form */}
          {paymentType === 'qrcode' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Image
              </label>
              {qrcodePreview ? (
                <div className="relative">
                  <img
                    src={qrcodePreview}
                    alt="Preview"
                    className="w-full max-w-xs mx-auto rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={() => {
                      setQrcodeFile(null);
                      setQrcodePreview('');
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-400 cursor-pointer transition-colors">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm text-gray-600">Click to upload QR code</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRCodeSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Bank Form */}
          {paymentType === 'bank' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <Input
                  placeholder="ธนาคารกรุงเทพ"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <Input
                  type="text"
                  placeholder="1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <Input
                  placeholder="นาย สมชาย ใจดี"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleAddPaymentMethod}
              fullWidth
              disabled={isUploading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isUploading ? 'Adding...' : 'Add Payment Method'}
            </Button>
            <Button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              variant="secondary"
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
