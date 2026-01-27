import { createBrowserClient } from '@supabase/ssr'
import { env, validateEnvironmentVariables } from './env'

export function createClient() {
  validateEnvironmentVariables()
  
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
