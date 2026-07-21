import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceRole);

/**
 * Uploads a base64 encoded image to Supabase Storage.
 * @param base64Str Data URL (e.g. data:image/png;base64,...) or regular URL
 * @param folder folder name inside the bucket (e.g. 'avatars', 'posts')
 * @returns The public URL of the uploaded file, or the original string if it is not a base64 string
 */
export async function uploadBase64ToSupabase(base64Str: string, folder: string = 'avatars'): Promise<string | null> {
  try {
    if (!base64Str) return null;
    
    // If it's already a URL, return it directly
    if (!base64Str.startsWith('data:image/')) {
      return base64Str;
    }

    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.warn('[Supabase Upload] Invalid Base64 format');
      return null;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const extension = mimeType.split('/')[1] || 'png';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const bucketName = process.env.SUPABASE_BUCKET || 'images';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('[Supabase Upload Error]', error);
      return base64Str;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('[uploadBase64ToSupabase] Error:', err);
    return base64Str;
  }
}
