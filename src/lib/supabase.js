import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "VITE_SUPABASE_URL não configurada. Verifique o arquivo .env.local."
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "VITE_SUPABASE_PUBLISHABLE_KEY não configurada. Verifique o arquivo .env.local."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "entrenos-auth",
      storage: window.localStorage,
      flowType: "pkce",
    },
  }
);
