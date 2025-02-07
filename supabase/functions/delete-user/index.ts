
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      throw new Error('No token provided')
    }

    console.log('Received token:', token)

    // Create a Supabase client with the auth admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the user from the token
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.getUser(token)
    
    if (getUserError || !user) {
      console.error('Error getting user:', getUserError)
      throw new Error('Invalid token or user not found')
    }

    console.log('User found:', user.id)

    // Delete the user's data from various tables in the correct order
    const userId = user.id

    // Delete running records first (due to foreign key constraint)
    const { error: runningRecordsError } = await supabaseAdmin
      .from('running_records')
      .delete()
      .eq('user_id', userId)

    if (runningRecordsError) {
      console.error('Error deleting running records:', runningRecordsError)
      throw new Error('Database error deleting running records')
    }

    // Delete running weekly stats
    const { error: weeklyStatsError } = await supabaseAdmin
      .from('running_weekly_stats')
      .delete()
      .eq('user_id', userId)

    if (weeklyStatsError) {
      console.error('Error deleting weekly stats:', weeklyStatsError)
    }

    // Delete challenge participants
    const { error: participantsError } = await supabaseAdmin
      .from('challenge_participants')
      .delete()
      .eq('user_id', userId)

    if (participantsError) {
      console.error('Error deleting challenge participants:', participantsError)
    }

    // Delete running badges
    const { error: badgesError } = await supabaseAdmin
      .from('running_badges')
      .delete()
      .eq('user_id', userId)

    if (badgesError) {
      console.error('Error deleting badges:', badgesError)
    }

    // Delete running challenges
    const { error: challengesError } = await supabaseAdmin
      .from('running_challenges')
      .delete()
      .eq('user_id', userId)

    if (challengesError) {
      console.error('Error deleting challenges:', challengesError)
    }

    // Delete transactions
    const { error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('user_id', userId)

    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError)
    }

    // Delete categories
    const { error: categoriesError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('user_id', userId)

    if (categoriesError) {
      console.error('Error deleting categories:', categoriesError)
    }

    // Delete user's profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw new Error('Database error deleting profile')
    }

    // Finally, delete the user's auth record
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('Error deleting user:', deleteUserError)
      throw deleteUserError
    }

    console.log('User and all related data deleted successfully')

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in delete-user function:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Database error deleting user',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
