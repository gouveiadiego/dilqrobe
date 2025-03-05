
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function verifySubscriptionsTable() {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { exists: false, error: 'Missing Supabase credentials' };
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to get table information
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Error checking subscriptions table:', error);
      return { exists: false, error: error.message };
    }
    
    return { exists: true, error: null };
  } catch (err) {
    console.error('Exception during table verification:', err);
    return { exists: false, error: err.message };
  }
}
