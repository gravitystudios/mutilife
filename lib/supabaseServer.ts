import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export type Order = {
  id: number
  order_number: string
  custom_tracking_reference: string
  order_status: string
  customer_name: string
  customer_phone: string
  entered_address: string
  bottles: number
  line_items?: Array<{ name: string; quantity: number }>
  collection_method: 'delivery' | 'collection' | 'DELIVERY' | 'COLLECTION'
  waybill_no: string | null
  pin: string | null
  created_at: string
  updated_at: string
}
