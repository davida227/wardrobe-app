import { SupabaseClient } from '@supabase/supabase-js';

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function compressImage(dataUrl: string, maxW = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Image compression timed out')), 10000);
    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        canvas.width = Math.max(1, Math.floor(img.width * ratio));
        canvas.height = Math.max(1, Math.floor(img.height * ratio));
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e: any) {
        reject(new Error('Compression failed: ' + e.message));
      }
    };
    img.onerror = () => { clearTimeout(timeout); reject(new Error('Failed to load image')); };
    img.src = dataUrl;
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function uploadImage(
  supabase: SupabaseClient,
  userId: string,
  dataUrl: string,
  prefix: string = 'item'
): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  const filename = `${userId}/${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;

  const { error } = await supabase.storage
    .from('clothing-images')
    .upload(filename, blob, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error('Upload failed: ' + error.message);

  const { data } = supabase.storage.from('clothing-images').getPublicUrl(filename);
  return data.publicUrl;
}

export async function deleteImage(supabase: SupabaseClient, imageUrl: string) {
  // Extract path from URL
  const match = imageUrl.match(/clothing-images\/(.+)$/);
  if (!match) return;
  await supabase.storage.from('clothing-images').remove([match[1]]);
}
