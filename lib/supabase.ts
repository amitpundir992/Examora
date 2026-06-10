import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadPdf(file: Buffer, filename: string): Promise<string> {
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
