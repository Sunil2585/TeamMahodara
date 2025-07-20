import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const rawBody = await req.text();
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error('Invalid JSON:', err);
    return new Response('Invalid JSON', { status: 200, headers: corsHeaders });
  }

  console.log('📦 Webhook Payload:', payload);

  // ✅ Handle Cashfree Test Webhook
  if (payload.type === 'WEBHOOK' && payload.data?.test_object) {
    console.log('✅ Test webhook received and acknowledged');
    return new Response(JSON.stringify({ status: 'acknowledged' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  // ✅ Process real payment status
  const orderId = payload.data?.order?.order_id;
  const paymentStatus = payload.data?.payment?.payment_status;

  if (!orderId || !paymentStatus) {
    console.log('❌ Missing orderId or paymentStatus');
    return new Response('Invalid webhook structure', { status: 200, headers: corsHeaders });
  }

  console.log(`🔍 Received status: ${paymentStatus} for order: ${orderId}`);

  // Extract contribution_id from order_id format: "order_<contribution_id>_<timestamp>"
  const match = orderId.match(/^order_(\d+)_/);
  if (!match) {
    console.log('❌ Could not extract contribution_id from order_id');
    return new Response('Invalid order_id format', { status: 200, headers: corsHeaders });
  }

  const contributionId = parseInt(match[1], 10);

  // Only update if payment is successful
  if (paymentStatus === 'SUCCESS') {
    const { error } = await supabase
      .from('contributions')
      .update({ status: 'success' })
      .eq('id', contributionId);

    if (error) {
      console.error('❌ Supabase update error:', error);
      return new Response('Database update failed', { status: 200, headers: corsHeaders });
    }

    console.log(`✅ Contribution ${contributionId} marked as success`);
  }

  return new Response('Webhook processed', { status: 200, headers: corsHeaders });
});
