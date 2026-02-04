import { createClient } from '@/lib/supabase-browser'

export async function logAction(
  action: string,
  tableName: string | null,
  recordId: string | null,
  details: any = null
) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('Cannot log action: No authenticated user')
      return
    }

    await supabase.from('audit_logs').insert({
      action,
      table_name: tableName,
      record_id: recordId,
      details,
      user_id: user.id
    })
  } catch (error) {
    console.error('Failed to log action:', error)
  }
}
