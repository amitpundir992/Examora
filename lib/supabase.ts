import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function uploadPdf(file: Buffer, filename: string): Promise<string | null> {
  if (!supabase) {
    console.warn("Supabase not configured, skipping PDF upload");
    return null;
  }

  const { data, error } = await supabase.storage
    .from("pdfs")
    .upload(`${Date.now()}-${filename}`, file, {
      contentType: "application/pdf",
      cacheControl: "3600",
    });

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from("pdfs")
    .getPublicUrl(data.path);

  return publicUrl;
}
