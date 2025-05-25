import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  console.log("=== NYTT ANROP MOTTAGET ===");
  console.log("Metod:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));

  if (req.method === "OPTIONS") {
    console.log("Hanterar OPTIONS-förfrågan");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== STARTAR FUNKTION ===");
    
    // Läs request body som text först
    const rawBody = await req.text();
    console.log("Rå data:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({
        error: "Invalid JSON",
        message: parseError.message,
        rawBody: rawBody
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log("Parsad data:", JSON.stringify(body, null, 2));

    // Validera required fields
    const { recipient, subject, content, from } = body;
    if (!recipient || !subject || !content || !from) {
      console.error("Saknade fält:", { recipient, subject, content, from });
      return new Response(JSON.stringify({
        error: "Missing required fields",
        message: "All fields (recipient, subject, content, from) are required",
        receivedFields: { recipient, subject, content, from }
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Formatera innehållet för HTML
    const htmlContent = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => `<p>${line}</p>`)
      .join('');

    const emailData = {
      to: recipient,
      subject: subject,
      text: content,
      html: htmlContent
    };

    console.log("Skickar till Railway:", JSON.stringify(emailData, null, 2));

    try {
      const response = await fetch("https://email-server-production-a333.up.railway.app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer e0192ffd-d77d-4fa6-9579-1bde3661efdf`
        },
        body: JSON.stringify(emailData)
      });

      const responseText = await response.text();
      console.log("Railway API response status:", response.status);
      console.log("Railway API response text:", responseText);
      console.log("Railway API response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = "Unknown error";
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.error || errorJson.message || responseText;
          console.log("Parsed error JSON:", errorJson);
        } catch (e) {
          console.log("Failed to parse error response:", e);
          errorMessage = responseText;
        }
        throw new Error(`Railway API error (${response.status}): ${errorMessage}`);
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log("Failed to parse success response:", e);
        responseData = { message: responseText };
      }

      return new Response(
        JSON.stringify({ message: "E-post skickad!", data: responseData }),
        { 
          headers: corsHeaders,
          status: 200 
        }
      );
    } catch (error) {
      console.error("Error in Railway API call:", error);
      console.error("Error stack:", error.stack);
      return new Response(
        JSON.stringify({ 
          error: error.message,
          details: error.stack,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: corsHeaders,
          status: 400 
        }
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: corsHeaders,
        status: 400 
      }
    );
  }
}); 