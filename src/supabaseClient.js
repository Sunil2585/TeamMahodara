import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttdctwfsfvlizsjvsjfo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZGN0d2ZzZnZsaXpzanZzamZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTU5MjcsImV4cCI6MjA2NzAzMTkyN30.NmrccNcF_4Pm7cUquODQrVe0t6h21ACftRUbI2tNs7E'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
