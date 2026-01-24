import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('Checking "tests" table schema...')
  
  // Try to select a single row to see what columns come back
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error selecting from tests:', error)
  } else {
    console.log('Successfully selected from tests.')
    if (data && data.length > 0) {
      console.log('Columns found in returned data:', Object.keys(data[0]))
    } else {
      console.log('Table is empty, cannot verify columns via select.')
    }
  }

  // Double check via RPC if possible, or just raw insert test
  console.log('Attempting dry-run insert with "difficulty" column...')
  const { error: insertError } = await supabase
    .from('tests')
    .insert([{
      title: 'Schema Test',
      difficulty: 'medium', // The problematic column
      test_type: 'mock'
    }])
    .select()

  if (insertError) {
    console.error('Insert failed:', insertError.message)
  } else {
    console.log('Insert success! (Schema is fine)')
  }
}

checkSchema()
