import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://rgsduganbthaakufhtnu.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ogfsnHU_WgVv4dAG0E32lQ_nwrLHHNU';
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
