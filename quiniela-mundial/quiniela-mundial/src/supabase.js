import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function loadData(id) {
  try {
    const { data, error } = await supabase.from('quiniela').select('data').eq('id', id).single();
    if (error || !data) return null;
    return data.data;
  } catch { return null; }
}

export async function saveData(id, payload) {
  try {
    await supabase.from('quiniela').upsert({ id, data: payload, updated_at: new Date().toISOString() });
  } catch {}
}
