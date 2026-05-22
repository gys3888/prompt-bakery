import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from either env variables or localStorage
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');

  let url = (envUrl || localUrl || '').trim();
  if (url) {
    url = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
  const key = (envKey || localKey || '').trim();

  return {
    url,
    key,
    isFromEnv: !!(envUrl && envKey),
    isConfigured: !!(url && key)
  };
};

let supabaseInstance = null;

export const getSupabaseClient = () => {
  const { url, key, isConfigured, isFromEnv } = getSupabaseConfig();
  
  if (!isConfigured) {
    supabaseInstance = null;
    return null;
  }

  // Re-create instance if credentials changed or not yet initialized
  if (!supabaseInstance || supabaseInstance.supabaseUrl !== url) {
    console.log('[Supabase] Initializing client instance', { url, source: isFromEnv ? 'Environment Variables (.env)' : 'Local Storage Settings' });
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      supabaseInstance = null;
      return null;
    }
  }

  return supabaseInstance;
};
