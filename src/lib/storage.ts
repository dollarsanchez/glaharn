import { supabase } from './supabase';

const BUCKET_NAME = 'qr-codes';

/**
 * Upload QR Code image to Supabase Storage
 * @param file - File object from input
 * @param billId - ID ของบิลเพื่อใช้ในการจัด folder
 * @returns Public URL of uploaded image
 */
export async function uploadQRCode(file: File, billId: string): Promise<string> {
  try {
    // สร้างชื่อไฟล์ที่ unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${billId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error('ไม่สามารถอัพโหลดรูปภาพได้');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Upload QR code error:', error);
    throw error;
  }
}

/**
 * Delete QR Code image from Supabase Storage
 * @param imageUrl - Public URL of the image to delete
 */
export async function deleteQRCode(imageUrl: string): Promise<void> {
  try {
    // Extract file path from public URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      console.warn('Invalid URL format for deletion:', imageUrl);
      return;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      // Don't throw error here as it's not critical
    }
  } catch (error) {
    console.error('Delete QR code error:', error);
    // Don't throw error here as it's not critical
  }
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File): boolean {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('กรุณาอัพโหลดไฟล์รูปภาพ (JPG, PNG, WEBP เท่านั้น)');
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('ขนาดไฟล์ต้องไม่เกิน 5MB');
  }

  return true;
}
