import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts'; // Ensure you have this shared file

// Helper function for creating standard JSON responses with CORS headers.
function jsonResponse(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

serve(async (req) => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Configuration and Server-Side Validation ---
    // For production, we directly use production variables.
    // These must be set in your Supabase Edge Function settings.
    const appId = Deno.env.get('CASHFREE_APP_ID');
    const secretKey = Deno.env.get('CASHFREE_SECRET_KEY');
    const cashfreeApiUrl = Deno.env.get('CASHFREE_API_URL'); // e.g., 'https://api.cashfree.com/pg/orders'
    const appUrl = Deno.env.get('APP_URL'); // e.g., 'https://tm-sunils-projects-b38a9fc6.vercel.app'

    if (!appId || !secretKey || !cashfreeApiUrl || !appUrl) {
      console.error('Server configuration error: Missing required environment variables.');
      return jsonResponse({ error: 'Server configuration error.' }, 500);
    }

    // --- 2. Client Input Parsing and Validation ---
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return jsonResponse({ error: 'Invalid JSON in request body.' }, 400);
    }

    const { amount, contributor, contribution_id } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return jsonResponse({ error: 'Invalid or missing "amount". It must be a positive number.' }, 400);
    }
    if (typeof contributor !== 'string' || contributor.trim() === '') {
      return jsonResponse({ error: 'Invalid or missing "contributor". It must be a non-empty string.' }, 400);
    }
    if (typeof contribution_id !== 'string' || contribution_id.trim() === '') {
      return jsonResponse({ error: 'Invalid or missing "contribution_id". It must be a non-empty string.' }, 400);
    }

    // --- 3. Prepare and Execute Cashfree API Call ---
    const orderId = `order_${contribution_id}_${Date.now()}`;

    const apiResponse = await fetch(cashfreeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2022-09-01',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: `user_${contribution_id}`,
          customer_name: contributor,
          // This is a required field by Cashfree.
          // If you don't collect a phone number, a placeholder is necessary.
          customer_phone: '9999999999',
        },
        order_meta: {
          // The {order_id} placeholder will be replaced by Cashfree upon redirect.
          return_url: `${appUrl}/payment-status?order_id={order_id}`,
        },
      }),
    });

    const responseData = await apiResponse.json();

    // --- 4. Handle Cashfree API Response ---
    if (!apiResponse.ok) {
      console.error('Cashfree API Error:', responseData);
      const errorMessage = responseData.message || `Cashfree API returned status ${apiResponse.status}`;
      // 502 Bad Gateway: our server's request to an upstream server (Cashfree) failed.
      return jsonResponse({ error: `Payment gateway error: ${errorMessage}` }, 502);
    }

    // Success: Forward the successful response from Cashfree to the client.
    return jsonResponse(responseData, 200);
  } catch (error) {
    // --- 5. Global Error Handler for Unexpected Errors ---
    console.error('Unhandled edge function error:', error);
    return jsonResponse({ error: 'An unexpected internal server error occurred.' }, 500);
  }
});
