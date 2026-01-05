
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  reply_to?: string; // Nuovo campo opzionale
}

serve(async (req) => {
  // Gestione CORS per le chiamate dal browser
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, reply_to } = await req.json() as EmailRequest;

    console.log(`[Send-Email v2] Request received for: ${to}`);

    if (!RESEND_API_KEY) {
      throw new Error("Manca la variabile d'ambiente RESEND_API_KEY su Supabase");
    }

    // Costruiamo il body per Resend
    const emailBody: any = {
      from: "LavoraBene <info@lavorabene.it>", 
      to: [to],
      subject: subject,
      html: html,
    };

    // Aggiungiamo Reply-To se presente
    if (reply_to) {
      emailBody.reply_to = reply_to;
    }

    // Chiamata a Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailBody),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend Error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
