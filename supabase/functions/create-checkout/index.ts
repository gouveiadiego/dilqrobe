
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { stripe } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, successUrl, cancelUrl, userId, userEmail } = await req.json();

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Price ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info either from the request or from the auth header
    let userInfo = null;
    
    // Case 1: Check if userId and userEmail were passed directly in the request body
    if (userId && userEmail) {
      console.log("Using user information provided in request body:", { userId, userEmail });
      userInfo = { id: userId, email: userEmail };
    } 
    // Case 2: Try to get user from auth header
    else {
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'No authentication information provided' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Parse the JWT token to get user info
      try {
        const token = authHeader.replace('Bearer ', '');
        const userResponse = await getUserFromToken(token);
        userInfo = userResponse;
        
        if (!userInfo || !userInfo.id || !userInfo.email) {
          throw new Error('Failed to get user information from token');
        }
      } catch (error) {
        console.error('Error getting user from token:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (!userInfo || !userInfo.id || !userInfo.email) {
      return new Response(
        JSON.stringify({ error: 'User information is incomplete' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Creating checkout session for user ${userInfo.id} (${userInfo.email}) with price ID ${priceId}`);

    // Determine the application host
    const origin = req.headers.get('origin') || 'https://dilqrobe.lovable.app';
    
    // Redirect URLs with specific query parameters
    const defaultSuccessUrl = `${origin}/dashboard?success=true&subscription=active&timestamp=${Date.now()}`;
    const defaultCancelUrl = `${origin}/dashboard?cancelled=true`;

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      customer_email: userInfo.email,
      client_reference_id: userInfo.id, // This is critical for the webhook to work
      metadata: {
        user_id: userInfo.id, // Adding user_id in metadata as well for redundancy
      },
      subscription_data: {
        metadata: {
          user_id: userInfo.id,
        },
      },
    });

    console.log("Checkout session created:", { 
      id: session.id, 
      url: session.url,
      customer_email: userInfo.email,
      client_reference_id: userInfo.id,
      success_url: session.success_url,
      cancel_url: session.cancel_url
    });

    // Pre-register the subscription as "pending" to help with detection
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // IMPORTANTE: Verificando a tabela correta 'subscriptions'
        console.log("Creating preliminary subscription record in the 'subscriptions' table");
        
        // Create a preliminary entry in the subscriptions table with more complete information
        const pendingSubscriptionData = {
          user_id: userInfo.id,
          status: 'pending',
          plan_type: 'stripe',
          price_id: priceId,
          stripe_customer_id: 'pending_' + session.id,
          stripe_checkout_session: session.id, // Store the session ID to match in webhook
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log("Creating preliminary subscription record:", pendingSubscriptionData);
        
        const { data, error } = await supabase.from('subscriptions').upsert(
          pendingSubscriptionData, 
          { onConflict: 'user_id' }
        );
        
        if (error) {
          console.error("Error creating preliminary subscription record:", error);
        } else {
          console.log("Created preliminary subscription record with pending status:", data);
        }
      }
    } catch (error) {
      // Don't fail the checkout if this step fails
      console.error("Error creating preliminary subscription record:", error);
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getUserFromToken(token) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase URL or service key not configured');
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Error getting user:', error);
      throw error || new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Error in getUserFromToken:', error);
    throw error;
  }
}
