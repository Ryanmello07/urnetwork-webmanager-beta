import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BACKEND_URL = "http://74.50.11.113:8080";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/functions\/v1\/api-proxy/, "");
    const targetUrl = `${BACKEND_URL}${path}${url.search}`;

    const forwardHeaders = new Headers();
    for (const [key, value] of req.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower !== "host" && lower !== "x-client-info" && lower !== "apikey") {
        forwardHeaders.set(key, value);
      }
    }

    const body =
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.arrayBuffer()
        : undefined;

    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const responseHeaders = new Headers(corsHeaders);
    for (const [key, value] of backendResponse.headers.entries()) {
      const lower = key.toLowerCase();
      if (
        lower !== "access-control-allow-origin" &&
        lower !== "access-control-allow-methods" &&
        lower !== "access-control-allow-headers"
      ) {
        responseHeaders.set(key, value);
      }
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Proxy error" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
