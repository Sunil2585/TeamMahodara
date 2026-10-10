import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://qaxnugdiafselbknbfer.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFheG51Z2RpYWZzZWxia25iZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODkxMjcsImV4cCI6MjA5ODM2NTEyN30.bCokbz0Sac-3sUS7nzac6QzHYYRTgMlu0QR61oReelA'


if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase credentials are not fully set in environment variables. " +
    "Please create a .env.local file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY " +
    "to connect to your new Supabase project."
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


