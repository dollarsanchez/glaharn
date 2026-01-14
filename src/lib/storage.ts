import { supabase } from './supabase';

const BUCKET_NAME = 'qr-codes';

/**
 * Upload QR Code image to Supabase Storage
 * @param file - File object from input
 * @param billId - ID ของบิลเพื่อใช้ในการจัด folder
 * @returns Public URL of uploaded image or base64 data URL as fallback
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
      console.log('Supabase upload not available, using base64 fallback:', error.message);
      // Fallback to base64 if Supabase is not available
      return await fileToBase64(file);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('✅ QR Code uploaded to Supabase successfully');
    return publicUrl;
  } catch (error) {
    console.log('Upload error, using base64 fallback:', error);
    // Fallback to base64
    return await fileToBase64(file);
  }
}

/**
 * Convert file to base64 data URL (fallback when Supabase is not available)
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
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
 * Upload Payment Slip image to Supabase Storage
 * @param file - File object from input
 * @param billId - ID ของบิลเพื่อใช้ในการจัด folder
 * @param memberId - ID ของสมาชิก
 * @returns Public URL of uploaded image or base64 data URL as fallback
 */
export async function uploadPaymentSlip(file: File, billId: string, memberId: string): Promise<string> {
  try {
    // สร้างชื่อไฟล์ที่ unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${billId}/slips/${memberId}-${Date.now()}.${fileExt}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.log('Supabase upload not available, using base64 fallback:', error.message);
      // Fallback to base64 if Supabase is not available
      return await fileToBase64(file);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('✅ Payment slip uploaded to Supabase successfully');
    return publicUrl;
  } catch (error) {
    console.log('Upload error, using base64 fallback:', error);
    // Fallback to base64
    return await fileToBase64(file);
  }
}

/**
 * Upload multiple Payment Slip images to Supabase Storage
 * @param files - Array of File objects from input
 * @param billId - ID ของบิลเพื่อใช้ในการจัด folder
 * @param memberId - ID ของสมาชิก
 * @returns Array of Public URLs of uploaded images or base64 data URLs as fallback
 */
export async function uploadMultiplePaymentSlips(
  files: File[],
  billId: string,
  memberId: string
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadPaymentSlip(file, billId, memberId)
  );
  return Promise.all(uploadPromises);
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns error message if invalid, null if valid
 */
export function validateImageFile(file: File): string | null {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'กรุณาอัพโหลดไฟล์รูปภาพ (JPG, PNG, WEBP เท่านั้น)';
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return 'ขนาดไฟล์ต้องไม่เกิน 5MB';
  }

  return null;
}
