import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

/** Create a per-project Supabase client with custom credentials. */
export function createProjectClient(url: string, anonKey: string) {
  return createClient(url, anonKey)
}
