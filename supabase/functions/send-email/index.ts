import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://web-production-2e81.up.railway.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  // Hantera CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // Lägg till CORS headers för alla svar
  const responseHeaders = { ...corsHeaders }

  try {
    console.log('Tar emot förfrågan...')
    const { recipient, subject, content, from } = await req.json()
    console.log('Mottagen data:', { recipient, subject, from })
    
    if (!recipient || !subject || !content || !from) {
      console.error('Saknade fält:', { recipient, subject, content: !!content, from })
      return new Response(
        JSON.stringify({ error: 'Saknade fält' }),
        { 
          status: 400,
          headers: responseHeaders
        }
      )
    }

    // Kontrollera miljövariabler
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = Deno.env.get('SMTP_PORT')
    const smtpUser = Deno.env.get('USERNAME')
    const smtpPass = Deno.env.get('PASSWORD')

    console.log('SMTP-konfiguration:', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser ? 'finns' : 'saknas',
      pass: smtpPass ? 'finns' : 'saknas'
    })

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.error('Saknade miljövariabler:', {
        host: !!smtpHost,
        port: !!smtpPort,
        user: !!smtpUser,
        pass: !!smtpPass
      })
      return new Response(
        JSON.stringify({ error: 'SMTP-konfiguration saknas' }),
        { 
          status: 500,
          headers: responseHeaders
        }
      )
    }

    try {
      console.log('Förbereder e-post...')
      
      const emailData = {
        From: from,
        To: recipient,
        Subject: subject,
        TextBody: content,
        HtmlBody: content.replace(/\n/g, '<br>')
      }

      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': smtpPass
        },
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Postmark API fel:', errorData)
        throw new Error(`Postmark API fel: ${errorData.Message || 'Okänt fel'}`)
      }

      console.log('E-post skickad via Postmark')

      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200,
          headers: responseHeaders
        }
      )
    } catch (emailError) {
      console.error('E-postfel:', emailError)
      return new Response(
        JSON.stringify({ 
          error: 'E-postfel',
          details: emailError.message
        }),
        { 
          status: 500,
          headers: responseHeaders
        }
      )
    }
  } catch (error) {
    console.error('Allmänt fel:', error)
    console.error('Felmeddelande:', error.message)
    console.error('Felstack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: 'Allmänt fel',
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: responseHeaders
      }
    )
  }
}) 