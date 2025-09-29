// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ✅ Evitar múltiples instancias (singleton)
let supabaseClient

if (!supabaseClient) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,  // guarda sesión en localStorage
      autoRefreshToken: true // refresca tokens expirados automáticamente
    }
  })
}

export const supabase = supabaseClient
