import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key dari file .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Membuat koneksi
export const supabase = createClient(supabaseUrl, supabaseKey);