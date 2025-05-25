import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAILWAY_ENDPOINT = 'https://email-server-production-a333.up.railway.app'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, content } = await req.json()
    console.log('Mottagen data:', { email, content })

    // Anropa Railway e-posttjänst
    console.log('Anropar Railway endpoint:', RAILWAY_ENDPOINT)
    const response = await fetch(RAILWAY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RAILWAY_API_KEY')}`,
      },
      body: JSON.stringify({
        to: email,
        subject: 'Tidrapport',
        text: content,
      }),
    })

    console.log('Railway response status:', response.status)
    const responseText = await response.text()
    console.log('Railway response:', responseText)

    if (!response.ok) {
      throw new Error(`Railway API error: ${response.status} ${responseText}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 