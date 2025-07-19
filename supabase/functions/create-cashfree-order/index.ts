import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts' // Ensure you have this shared file

serve(async (req) => {
  // This is needed for CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Determine the environment. Defaults to 'sandbox' if not set.
    const isProduction = Deno.env.get('CASHFREE_ENVIRONMENT') === 'production';

    // Select keys and URL based on the environment
    const appId = isProduction
      ? Deno.env.get('CASHFREE_PRODUCTION_APP_ID')
      : Deno.env.get('CASHFREE_SANDBOX_APP_ID');

    const secretKey = isProduction
      ? Deno.env.get('CASHFREE_PRODUCTION_SECRET_KEY')
      : Deno.env.get('CASHFREE_SANDBOX_SECRET_KEY');

    const cashfreeApiUrl = isProduction
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    // The return_url must also be environment-specific
    // IMPORTANT: Replace 'https://your-app-url.com' with your actual production domain
    const returnUrlBase = isProduction
      ? 'https://team-mahodaraa.vercel.app/login'
      : 'http://localhost:3000';

    if (!appId || !secretKey) {
      const env = isProduction ? 'production' : 'sandbox';
      throw new Error(`Cashfree ${env} credentials are not set in environment variables.`);
    }
    
    const { amount, contributor, contribution_id } = await req.json()
    const orderId = `order_${contribution_id}_${Date.now()}`

    const response = await fetch(cashfreeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2022-09-01', // Use a recent, stable API version
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: `user_${contribution_id}`,
          customer_name: contributor,
          customer_phone: '9999999999', // Required by Cashfree. Use a real number if available.
        },
        order_meta: {
          return_url: `${returnUrlBase}/payment-status?order_id={order_id}`,
        },
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("Cashfree API Error:", responseData);
      // Forward the error message from Cashfree if available, otherwise stringify the whole response
      const errorMessage = responseData.message || `Cashfree API returned status ${response.status}: ${JSON.stringify(responseData)}`;
      throw new Error(errorMessage);
    }

    // The responseData object from Cashfree contains the payment_session_id
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
