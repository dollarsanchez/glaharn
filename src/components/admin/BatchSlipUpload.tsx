'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Member } from '@/types';
import { validateImageFile, uploadPaymentSlip } from '@/lib/storage';

interface UploadItem {
  id: string;
  member: Member;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface BatchSlipUploadProps {
  members: Member[];
  billId: string;
  onUploadComplete: (memberId: string, imageUrl: string) => Promise<void>;
}

export default function BatchSlipUpload({ members, billId, onUploadComplete }: BatchSlipUploadProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (memberId: string, file: File) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    try {
      validateImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        const newUpload: UploadItem = {
          id: `${memberId}-${Date.now()}`,
          member,
          file,
          preview: reader.result as string,
          status: 'pending',
        };

        setUploads(prev => [...prev, newUpload]);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const uploadAll = async () => {
    setIsUploading(true);

    for (const upload of uploads) {
      if (upload.status === 'success') continue;

      // Update status to uploading
      setUploads(prev => prev.map(u =>
        u.id === upload.id ? { ...u, status: 'uploading' as const } : u
      ));

      try {
        const imageUrl = await uploadPaymentSlip(upload.file, billId, upload.member.id);
        await onUploadComplete(upload.member.id, imageUrl);

        // Update status to success
        setUploads(prev => prev.map(u =>
          u.id === upload.id ? { ...u, status: 'success' as const } : u
        ));
      } catch (error: any) {
        // Update status to error
        setUploads(prev => prev.map(u =>
          u.id === upload.id ? { ...u, status: 'error' as const, error: error.message } : u
        ));
      }
    }

    setIsUploading(false);
  };

  const pendingCount = uploads.filter(u => u.status === 'pending').length;
  const successCount = uploads.filter(u => u.status === 'success').length;
  const errorCount = uploads.filter(u => u.status === 'error').length;

  return (
    <Card className="shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Batch Upload Payment Slips</h2>
          <p className="text-sm text-gray-600 mt-1">Upload multiple payment slips at once</p>
        </div>
        {uploads.length > 0 && (
          <div className="flex items-center gap-2">
            {successCount > 0 && <Badge variant="success">{successCount} uploaded</Badge>}
            {errorCount > 0 && <Badge variant="danger">{errorCount} failed</Badge>}
          </div>
        )}
      </div>

      {/* Member Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select members and upload their payment slips
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {members.map((member) => {
              const hasUpload = uploads.some(u => u.member.id === member.id);
              return (
                <label
                  key={member.id}
                  className={`relative flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    hasUpload
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileSelect(member.id, file);
                        e.target.value = ''; // Reset input
                      }
                    }}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{member.name}</p>
                    {member.paymentSlipUrl && (
                      <p className="text-xs text-violet-600">Has slip</p>
                    )}
                  </div>
                  {hasUpload && (
                    <span className="text-violet-600 text-xl">✓</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Upload Preview */}
        {uploads.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Ready to Upload ({uploads.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={upload.preview}
                    alt={`${upload.member.name}'s slip`}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{upload.member.name}</p>
                    <p className="text-xs text-gray-500">{upload.file.name}</p>
                    {upload.error && (
                      <p className="text-xs text-rose-600 mt-1">{upload.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {upload.status === 'pending' && (
                      <Badge variant="default">Pending</Badge>
                    )}
                    {upload.status === 'uploading' && (
                      <Badge variant="warning">Uploading...</Badge>
                    )}
                    {upload.status === 'success' && (
                      <Badge variant="success">✓ Done</Badge>
                    )}
                    {upload.status === 'error' && (
                      <Badge variant="danger">Error</Badge>
                    )}
                    {upload.status === 'pending' && !isUploading && (
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="text-rose-600 hover:text-rose-700 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={uploadAll}
                fullWidth
                disabled={isUploading || pendingCount === 0}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isUploading ? '⏳ Uploading...' : `📤 Upload All (${pendingCount})`}
              </Button>
              {!isUploading && (
                <Button
                  onClick={() => setUploads([])}
                  variant="secondary"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {uploads.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-6xl mb-4">📤</p>
          <p className="text-lg font-medium">No slips selected</p>
          <p className="text-sm mt-1">Click on member cards above to select payment slips</p>
        </div>
      )}
    </Card>
  );
}
