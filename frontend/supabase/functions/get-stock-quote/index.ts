import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const UPSTOX_ACCESS_TOKEN = Deno.env.get("UPSTOX_ACCESS_TOKEN") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { symbol, instrumentKey } = await req.json();
    const resolvedInstrumentKey = String(instrumentKey || symbol || "").trim();

    if (!resolvedInstrumentKey) {
      return new Response(
        JSON.stringify({ error: "instrumentKey is required (e.g. NSE_EQ|INE002A01018)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!UPSTOX_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: "UPSTOX_ACCESS_TOKEN is not configured in Supabase environment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(
      `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(resolvedInstrumentKey)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${UPSTOX_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data?.errors?.[0]?.message || data?.message || "Upstox quote request failed" }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const quote = Object.values((data?.data || {}))[0] as any;

    if (!quote || !quote?.last_price) {
      return new Response(
        JSON.stringify({ error: "Stock quote not found for provided instrument key" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lastPrice = Number(quote?.last_price || quote?.ohlc?.close || 0);
    const netChange = Number(quote?.net_change || 0);
    const previousClose = lastPrice - netChange;
    const changePercent = previousClose ? (netChange / previousClose) * 100 : 0;

    return new Response(
      JSON.stringify({
        symbol: quote?.symbol || resolvedInstrumentKey,
        price: lastPrice,
        change: netChange,
        changePercent,
        high: Number(quote?.ohlc?.high || 0),
        low: Number(quote?.ohlc?.low || 0),
        open: Number(quote?.ohlc?.open || 0),
        previousClose: Number(previousClose || 0),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
