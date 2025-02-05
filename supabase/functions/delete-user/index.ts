import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      throw new Error('No authorization header')
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '')
    console.log('Received token:', token.substring(0, 10) + '...')

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )

    // Get the current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      throw sessionError
    }

    if (!session) {
      console.error('No session found')
      throw new Error('Not authenticated')
    }

    console.log('Authenticated user:', session.user.id)

    // Create a Supabase admin client
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

    // Delete the user's profile first
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', session.user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw new Error(`Error deleting profile: ${profileError.message}`)
    }

    console.log('Profile deleted successfully')

    // Delete the user from auth.users
    const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(
      session.user.id
    )

    if (userError) {
      console.error('Error deleting user:', userError)
      throw new Error(`Error deleting user: ${userError.message}`)
    }

    console.log('User deleted successfully')

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
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})