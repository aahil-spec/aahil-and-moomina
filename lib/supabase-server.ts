import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || 'placeholder_key';

// Server-only client — never expose this to the browser
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});