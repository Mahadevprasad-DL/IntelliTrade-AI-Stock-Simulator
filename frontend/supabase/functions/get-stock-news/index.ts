import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { symbol } = await req.json();
    const rawSymbol = String(symbol || "").trim().toUpperCase().replace(".BSE", "").replace(".NSE", "");

    if (!rawSymbol) {
      return new Response(
        JSON.stringify({ error: "Symbol is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const query = encodeURIComponent(`${rawSymbol} stock`);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const response = await fetch(rssUrl, {
      method: "GET",
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `News provider request failed (${response.status})` }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const xmlText = await response.text();

    const extractTag = (chunk: string, tag: string): string => {
      const match = chunk.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      if (!match) return "";
      return match[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const sentimentFromText = (text: string) => {
      const lower = String(text || "").toLowerCase();
      const positive = ["surge", "rally", "beats", "growth", "record high", "upgrades", "buy", "strong", "gain", "bullish"];
      const negative = ["falls", "drop", "misses", "weak", "downgrade", "sell", "loss", "bearish", "decline", "plunge", "slumps"];

      let score = 0;
      positive.forEach((term) => {
        if (lower.includes(term)) score += 1;
      });
      negative.forEach((term) => {
        if (lower.includes(term)) score -= 1;
      });

      const normalized = Math.max(-1, Math.min(1, score / 4));
      const label = normalized > 0.15 ? "Bullish" : normalized < -0.15 ? "Bearish" : "Neutral";

      return { score: normalized, label };
    };

    const itemMatches = Array.from(xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi)).slice(0, 20);

    const articles = itemMatches.map((match) => {
      const chunk = String(match[1] || "");
      const title = extractTag(chunk, "title") || "Untitled article";
      const url = extractTag(chunk, "link") || "#";
      const source = extractTag(chunk, "source") || "Google News";
      const published = extractTag(chunk, "pubDate");
      const summary = extractTag(chunk, "description") || title;
      const sentiment = sentimentFromText(`${title} ${summary}`);

      return {
        title,
        url,
        time_published: published ? new Date(published).toISOString() : "",
        authors: [],
        summary,
        source,
        sentiment_score: sentiment.score,
        sentiment_label: sentiment.label,
      };
    });

    return new Response(
      JSON.stringify({ articles }),
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
