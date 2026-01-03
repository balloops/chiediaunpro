
# Configurazione Invio Email (Supabase + Resend)

Per far sì che l'applicazione invii realmente le email, devi configurare una **Edge Function** su Supabase. L'applicazione frontend è già configurata per chiamare questa funzione.

## 1. Prerequisiti

1.  Un account [Resend.com](https://resend.com) (è il provider email partner di Supabase, ha un piano gratuito ottimo).
2.  Ottieni la tua **API Key** da Resend.
3.  Verifica un dominio su Resend (o usa l'email di test `onboarding@resend.dev` se stai solo testando verso la tua stessa email).

## 2. Configurazione Supabase (Terminale)

Se hai installato la CLI di Supabase, esegui questi comandi nella cartella del progetto:

```bash
# 1. Login su Supabase (se non l'hai fatto)
supabase login

# 2. Inizializza il progetto (se non l'hai fatto)
supabase init

# 3. Crea la funzione 'send-email'
supabase functions new send-email
```

Questo creerà una cartella `supabase/functions/send-email`.

## 3. Codice della Funzione (`index.ts`)

Copia e incolla questo codice nel file `supabase/functions/send-email/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  // Gestione CORS per le chiamate dal browser
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json() as EmailRequest;

    if (!RESEND_API_KEY) {
      throw new Error("Manca la variabile d'ambiente RESEND_API_KEY");
    }

    // Chiamata a Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        // IMPORTANTE: In test usa 'onboarding@resend.dev', in prod usa il tuo dominio verificato
        from: "LavoraBene <onboarding@resend.dev>", 
        to: [to],
        subject: subject,
        html: html,
      }),
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

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## 4. Imposta la Variabile d'Ambiente

Vai nella dashboard del tuo progetto Supabase online:
1.  **Settings** -> **Edge Functions**.
2.  Aggiungi una nuova variabile segreta (Secret):
    *   Name: `RESEND_API_KEY`
    *   Value: `re_123456...` (La tua chiave API di Resend)

## 5. Deploy della Funzione

Esegui il deploy dal tuo terminale:

```bash
supabase functions deploy send-email --no-verify-jwt
```

*(Il flag `--no-verify-jwt` permette di chiamare la funzione anche lato pubblico se necessario, ma idealmente dovresti configurare le policy. Per ora, il codice frontend usa il client Supabase autenticato che passa il JWT automaticamente, quindi puoi anche rimuovere il flag se sei loggato, ma per test rapidi va bene)*.

## Finito!

Ora, quando:
1.  Un Pro invia un preventivo -> Il cliente riceve l'email.
2.  Un Cliente accetta -> Il Pro riceve l'email.
