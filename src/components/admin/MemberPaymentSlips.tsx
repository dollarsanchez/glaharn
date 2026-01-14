'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Member, PaymentSlip } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface MemberPaymentSlipsProps {
  member: Member;
  onVerifySlip: (slipIndex: number) => Promise<void>;
  onRejectSlip: (slipIndex: number) => Promise<void>;
}

export default function MemberPaymentSlips({
  member,
  onVerifySlip,
  onRejectSlip,
}: MemberPaymentSlipsProps) {
  const [selectedSlipIndex, setSelectedSlipIndex] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const paymentSlips = member.paymentSlips || [];

  // Backward compatibility: check old paymentSlipUrl
  const hasOldSlip = member.paymentSlipUrl && paymentSlips.length === 0;

  const allSlips: (PaymentSlip & { isLegacy?: boolean })[] = hasOldSlip
    ? [
        {
          url: member.paymentSlipUrl!,
          verified: member.paymentVerified || false,
          uploadedAt: new Date(),
          isLegacy: true,
        },
      ]
    : paymentSlips;

  const handleViewImage = (index: number) => {
    setSelectedSlipIndex(index);
    setShowImageModal(true);
  };

  const verifiedCount = allSlips.filter((s) => s.verified).length;
  const pendingCount = allSlips.filter((s) => !s.verified).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Payment Slips
          {allSlips.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({verifiedCount} verified, {pendingCount} pending)
            </span>
          )}
        </h3>
      </div>

      {allSlips.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-4xl mb-2">📄</p>
          <p className="text-gray-600 text-sm">No payment slips uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allSlips.map((slip, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden transition-all ${
                slip.verified
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200'
                  : 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-2 right-2 z-10">
                {slip.verified ? (
                  <Badge variant="success" className="shadow-sm">
                    ✓ Verified
                  </Badge>
                ) : (
                  <Badge variant="warning" className="shadow-sm">
                    ⏳ Pending
                  </Badge>
                )}
              </div>

              {/* Slip Image */}
              <div
                onClick={() => handleViewImage(idx)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={slip.url}
                    alt={`Payment Slip ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity">
                      🔍
                    </div>
                  </div>
                </div>
              </div>

              {/* Slip Info */}
              <div className="mt-3">
                {slip.note && (
                  <p className="text-sm text-gray-700 font-medium mb-2">
                    📝 {slip.note}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Uploaded:{' '}
                  {new Date(slip.uploadedAt).toLocaleString('th-TH', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              {/* Action Buttons */}
              {!slip.verified && !slip.isLegacy && (
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => onVerifySlip(idx)}
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    ✓ Verify
                  </Button>
                  <Button
                    onClick={() => onRejectSlip(idx)}
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-rose-600 hover:bg-rose-50"
                  >
                    ✗ Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedSlipIndex !== null && (
        <Modal
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false);
            setSelectedSlipIndex(null);
          }}
          title={`Payment Slip ${selectedSlipIndex + 1}`}
        >
          <div className="space-y-4">
            <img
              src={allSlips[selectedSlipIndex].url}
              alt={`Payment Slip ${selectedSlipIndex + 1}`}
              className="w-full rounded-lg border-2 border-gray-200"
            />

            {allSlips[selectedSlipIndex].note && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  📝 Note: {allSlips[selectedSlipIndex].note}
                </p>
              </div>
            )}

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                Uploaded:{' '}
                {new Date(allSlips[selectedSlipIndex].uploadedAt).toLocaleString('th-TH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            {!allSlips[selectedSlipIndex].verified && !allSlips[selectedSlipIndex].isLegacy && (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={async () => {
                    await onVerifySlip(selectedSlipIndex);
                    setShowImageModal(false);
                    setSelectedSlipIndex(null);
                  }}
                  fullWidth
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  ✓ Verify This Slip
                </Button>
                <Button
                  onClick={async () => {
                    await onRejectSlip(selectedSlipIndex);
                    setShowImageModal(false);
                    setSelectedSlipIndex(null);
                  }}
                  fullWidth
                  variant="secondary"
                  className="text-rose-600 hover:bg-rose-50"
                >
                  ✗ Reject
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
