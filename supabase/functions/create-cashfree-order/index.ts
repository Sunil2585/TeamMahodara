import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, contributor, contribution_id, return_url } = await req.json()

    // Retrieve Cashfree Credentials from Supabase Secrets
    const appId = Deno.env.get("CASHFREE_APP_ID")
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY")
    const cashfreeEnv = Deno.env.get("CASHFREE_ENV") || "sandbox" // "sandbox" or "production"

    if (!appId || !secretKey) {
      throw new Error("Missing Cashfree configuration in Supabase Secrets (CASHFREE_APP_ID or CASHFREE_SECRET_KEY)")
    }

    const host = cashfreeEnv === "production" 
      ? "https://api.cashfree.com" 
      : "https://sandbox.cashfree.com"

    console.log(`Creating Cashfree order in ${cashfreeEnv} mode...`)

    // Cashfree Production requires HTTPS for return_url, Sandbox does not
    let formattedReturnUrl = return_url || "http://localhost:3000/contributions"
    if (cashfreeEnv === "production" && formattedReturnUrl.startsWith("http://")) {
      formattedReturnUrl = formattedReturnUrl.replace("http://", "https://")
    }


    const response = await fetch(`${host}/pg/orders`, {
      method: "POST",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: `order_${contribution_id}_${Date.now()}`,
        order_amount: Number(amount),
        order_currency: "INR",
        customer_details: {
          customer_id: `cust_${contribution_id}_${Date.now()}`,
          customer_name: contributor || "Unnamed Contributor",
          customer_phone: "9999999999", // Default placeholder phone number
          customer_email: "contributor@example.com",
        },
        order_meta: {
          return_url: formattedReturnUrl,
        }
      })
    })


    const data = await response.json()

    if (!response.ok) {
      console.error("Cashfree API error:", data)
      throw new Error(data.message || "Failed to create order on Cashfree")
    }

    return new Response(
      JSON.stringify({ payment_session_id: data.payment_session_id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error("Function error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
