import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BACKEND_BASE = "http://74.50.11.113:8080";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Supabase strips /functions/v1 but keeps the slug; handle both variants.
    const path = url.pathname.replace(/^\/(functions\/v1\/)?api-proxy/, "") || "/";
    const targetUrl = `${BACKEND_BASE}${path}${url.search}`;

    const isBodyless = req.method === "GET" || req.method === "HEAD";

    const forwardHeaders = new Headers();
    // Set the correct Host for the backend so virtual-host routing works.
    forwardHeaders.set("Host", "74.50.11.113:8080");

    for (const [key, value] of req.headers.entries()) {
      const lower = key.toLowerCase();
      // Skip hop-by-hop and Supabase-specific headers, and Content-Type on bodyless requests.
      if (
        lower === "host" ||
        lower === "x-client-info" ||
        lower === "apikey" ||
        lower === "x-forwarded-for" ||
        lower === "x-forwarded-proto" ||
        lower === "x-forwarded-host" ||
        lower === "x-real-ip" ||
        (lower === "content-type" && isBodyless)
      ) {
        continue;
      }
      forwardHeaders.set(key, value);
    }

    const body = isBodyless ? undefined : await req.arrayBuffer();

    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const responseHeaders = new Headers(corsHeaders);
    // Surface the constructed target URL for debugging via DevTools.
    responseHeaders.set("X-Proxy-Target", targetUrl);

    for (const [key, value] of backendResponse.headers.entries()) {
      const lower = key.toLowerCase();
      if (
        lower === "access-control-allow-origin" ||
        lower === "access-control-allow-methods" ||
        lower === "access-control-allow-headers"
      ) {
        continue;
      }
      responseHeaders.set(key, value);
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return new Response(
      JSON.stringify({ error: message, proxy: "api-proxy" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
