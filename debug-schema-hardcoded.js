const { createClient } = require('@supabase/supabase-js')

// Hardcoded for debug purposes only
const supabaseUrl = 'https://pdezaknywnxqwecgigdw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZXpha255d254cXdlY2dpZ2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY1MTQsImV4cCI6MjA4NDc0MjUxNH0.kzYnJi1KI49LsLWuXsDAZKWTmqGmVSEKIMDK3yOzKWk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('--- START DEBUG ---')
  console.log('Checking "tests" table schema...')
  
  // 1. Check if we can SELECT the new columns
  const { data, error } = await supabase
    .from('tests')
    .select('id, difficulty, passing_marks')
    .limit(1)

  if (error) {
    console.error('SELECT Error:', error.message)
    console.error('Details:', error.details)
    console.error('Hint:', error.hint)
  } else {
    console.log('SELECT Success. Data:', data)
  }

  // 2. Try an INSERT
  console.log('\nAttempting INSERT with difficulty column...')
  const { data: insertData, error: insertError } = await supabase
    .from('tests')
    .insert([{
      title: 'Debug Test ' + Date.now(),
      difficulty: 'medium',
      test_type: 'mock',
      duration_minutes: 60,
      total_marks: 100,
      slug: 'debug-test-' + Date.now(),
      passing_marks: 30
    }])
    .select()

  if (insertError) {
    console.error('INSERT Error:', insertError.message)
    console.error('Details:', insertError.details)
    console.error('Hint:', insertError.hint)
  } else {
    console.log('INSERT Success:', insertData)
    // Cleanup
    if (insertData && insertData[0]) {
       await supabase.from('tests').delete().eq('id', insertData[0].id)
       console.log('Cleanup: Deleted debug row.')
    }
  }
  console.log('--- END DEBUG ---')
}

checkSchema()
