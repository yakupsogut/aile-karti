import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqisrylafthdrwvvfjfc.supabase.co';
const supabaseAnonKey = 'sb_publishable_YgXDKq0IifhctCMUdGKdbw_T0lVv2S3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
