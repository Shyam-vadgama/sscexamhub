// Environment variables validation
export function validateEnvironmentVariables() {
  const missingEnvVars: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missingEnvVars.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missingEnvVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
      'Please check your environment configuration.'
    );
  }
}

// Environment variables with fallbacks
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const;