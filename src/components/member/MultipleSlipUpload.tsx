'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { PaymentSlip } from '@/types';
import { validateImageFile } from '@/lib/storage';

interface PendingUpload {
  id: string;
  file: File;
  preview: string;
  note: string;
}

interface MultipleSlipUploadProps {
  existingSlips: PaymentSlip[];
  onUpload: (files: File[], notes: string[]) => Promise<void>;
  isUploading: boolean;
}

export default function MultipleSlipUpload({
  existingSlips,
  onUpload,
  isUploading,
}: MultipleSlipUploadProps) {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      const error = validateImageFile(file);
      if (error) {
        alert(error);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingUploads((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            file,
            preview: reader.result as string,
            note: '',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    setPendingUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleNoteChange = (id: string, note: string) => {
    setPendingUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, note } : u))
    );
  };

  const handleUploadAll = async () => {
    if (pendingUploads.length === 0) return;

    const files = pendingUploads.map((u) => u.file);
    const notes = pendingUploads.map((u) => u.note);

    await onUpload(files, notes);
    setPendingUploads([]);
  };

  const verifiedCount = existingSlips.filter((s) => s.verified).length;
  const pendingCount = existingSlips.filter((s) => !s.verified).length;

  return (
    <div className="space-y-6">
      {/* Existing Slips */}
      {existingSlips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              ประวัติการอัพโหลด
            </h3>
            <div className="flex items-center gap-2">
              {verifiedCount > 0 && (
                <Badge variant="success">{verifiedCount} ตรวจสอบแล้ว</Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="warning">{pendingCount} รอตรวจสอบ</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {existingSlips.map((slip, idx) => (
              <Card
                key={idx}
                className={`overflow-hidden ${
                  slip.verified
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200'
                }`}
              >
                <div className="relative">
                  <img
                    src={slip.url}
                    alt={`Slip ${idx + 1}`}
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2">
                    {slip.verified ? (
                      <Badge variant="success" className="shadow-lg">
                        ✓ ตรวจสอบแล้ว
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="shadow-lg">
                        ⏳ รอตรวจสอบ
                      </Badge>
                    )}
                  </div>
                </div>
                {slip.note && (
                  <p className="mt-2 text-sm text-gray-700">
                    📝 {slip.note}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(slip.uploadedAt).toLocaleString('th-TH', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          อัพโหลดสลิปใหม่
        </h3>

        {pendingUploads.length === 0 ? (
          <label htmlFor="slip-upload" className="block">
            <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer transition-all duration-300 group">
              <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">
                📄
              </div>
              <p className="text-gray-700 font-bold text-xl mb-2">
                คลิกเพื่อเลือกรูปสลิป
              </p>
              <p className="text-gray-500">
                รองรับ JPG, PNG, WEBP (สูงสุด 5MB)<br />
                สามารถเลือกได้หลายไฟล์พร้อมกัน
              </p>
            </div>
            <input
              id="slip-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        ) : (
          <div className="space-y-4">
            {/* Pending Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUploads.map((upload) => (
                <Card key={upload.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <div className="relative">
                    <img
                      src={upload.preview}
                      alt="Preview"
                      className="w-full aspect-[3/4] object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemove(upload.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 shadow-lg"
                      disabled={isUploading}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      บันทึก (ถ้ามี)
                    </label>
                    <Input
                      placeholder="เช่น โอนให้ John ส่วนที่ 1"
                      value={upload.note}
                      onChange={(e) => handleNoteChange(upload.id, e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleUploadAll}
                fullWidth
                disabled={isUploading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg py-4"
              >
                {isUploading
                  ? '⏳ กำลังอัพโหลด...'
                  : `📤 อัพโหลดทั้งหมด (${pendingUploads.length})`}
              </Button>
              <label htmlFor="slip-upload-more" className="flex-shrink-0">
                <span
                  className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                    isUploading
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  + เพิ่ม
                </span>
                <input
                  id="slip-upload-more"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              <Button
                onClick={() => setPendingUploads([])}
                variant="secondary"
                disabled={isUploading}
              >
                ล้าง
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
