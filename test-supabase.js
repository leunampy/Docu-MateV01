import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://igzwodlppxscqjrqgfxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnendvZGxwcHhzY3FqcnFnZnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTQ3ODAsImV4cCI6MjA3ODQ3MDc4MH0.GRlJxBH6W1SZDtALMv0zdB2VxhsiyiUwIi1CDk2uMy4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🧪 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('document_generations')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Supabase connected!');
      console.log('📊 Found records:', data.length);
      console.log('📄 Data:', data);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testSupabase();
