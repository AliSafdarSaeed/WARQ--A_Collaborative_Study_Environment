import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://yzhlvstevatvqdkrjzle.supabase.co";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aGx2c3RldmF0dnFka3JqemxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTM3MDQsImV4cCI6MjA2MjU2OTcwNH0.M9VAM5uSg5bRinYm50CUOfVmJlhmnasJk7PRYfXJuNc";
export const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'uploads'; // <--- use this everywhere

export async function uploadFileToSupabase(file, noteId) {
  const filePath = `${noteId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data: publicUrlData, error: urlError } = supabase
    .storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  if (urlError) throw urlError;

  return {
    url: publicUrlData.publicUrl,
    name: file.name,
    type: file.type,
    size: file.size,
    path: filePath,
  };
}
