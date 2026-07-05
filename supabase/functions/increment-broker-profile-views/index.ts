// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseClient.rpc('increment_broker_profile_views', {
      broker_id: user_id
    });

    if (error) {
      console.error("Error calling RPC:", error);

      // Fallback: direct update if RPC fails (e.g. if RPC hasn't been deployed yet)
      console.log("Attempting fallback direct update...");

      // First get current value
      const { data: broker, error: readError } = await supabaseClient
        .from('broker_profiles')
        .select('profile_views_this_month')
        .eq('user_id', user_id)
        .single();

      if (readError) {
         return new Response(
          JSON.stringify({ error: "Failed to read profile views" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const currentViews = broker?.profile_views_this_month || 0;

      const { error: updateError } = await supabaseClient
        .from('broker_profiles')
        .update({ profile_views_this_month: currentViews + 1 })
        .eq('user_id', user_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update profile views via fallback" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ message: "Successfully incremented views" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
