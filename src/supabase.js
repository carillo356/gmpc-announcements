import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://fcmjapttrzjgddossbmn.supabase.co"
const supabaseKey = "sb_publishable_OGYu4i_9eFFzh7d-jwk3Kg_F9cosMEy"

export const supabase = createClient(supabaseUrl, supabaseKey)