import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "all";
    const results: Record<string, unknown> = {};
    const now = new Date().toISOString();

    if (action === "publish" || action === "all") {
      const { data: toPublish } = await supabase
        .from("ads")
        .select("id, title, user_id")
        .eq("status", "scheduled")
        .lte("publish_at", now);

      let published = 0;
      for (const ad of toPublish ?? []) {
        await supabase.from("ads").update({ status: "published" }).eq("id", ad.id);
        await supabase.from("ad_status_history").insert({
          ad_id: ad.id,
          previous_status: "scheduled",
          new_status: "published",
          note: "Auto-published by cron",
        });
        published++;
      }

      await supabase.from("system_health_logs").insert({
        source: "cron_publish",
        response_ms: 0,
        status: "ok",
        message: `Published ${published} scheduled ads`,
      });

      results.published = published;
    }

    if (action === "expire" || action === "all") {
      const { data: toExpire } = await supabase
        .from("ads")
        .select("id, title, user_id, expire_at")
        .eq("status", "published")
        .lte("expire_at", now);

      let expired = 0;
      for (const ad of toExpire ?? []) {
        await supabase.from("ads").update({ status: "expired" }).eq("id", ad.id);
        await supabase.from("ad_status_history").insert({
          ad_id: ad.id,
          previous_status: "published",
          new_status: "expired",
          note: "Auto-expired by cron",
        });
        await supabase.from("notifications").insert({
          user_id: ad.user_id,
          title: "Ad Expired",
          message: `Your ad "${ad.title}" has expired. Renew to keep it visible.`,
          type: "warning",
        });
        expired++;
      }

      await supabase.from("system_health_logs").insert({
        source: "cron_expire",
        response_ms: 0,
        status: "ok",
        message: `Expired ${expired} ads`,
      });

      results.expired = expired;
    }

    if (action === "notify-expiring" || action === "all") {
      const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const { data: expiring } = await supabase
        .from("ads")
        .select("id, title, user_id, expire_at")
        .eq("status", "published")
        .lte("expire_at", in48h)
        .gte("expire_at", now);

      for (const ad of expiring ?? []) {
        const hoursLeft = Math.ceil(
          (new Date(ad.expire_at).getTime() - Date.now()) / 3600000
        );
        await supabase.from("notifications").insert({
          user_id: ad.user_id,
          title: "Ad Expiring Soon",
          message: `Your ad "${ad.title}" expires in ${hoursLeft} hours. Renew now!`,
          type: "warning",
        });
      }

      results.expiry_notices_sent = (expiring ?? []).length;
    }

    if (action === "heartbeat" || action === "all") {
      const start = Date.now();
      await supabase.from("users").select("id", { head: true, count: "exact" });
      const ms = Date.now() - start;

      await supabase.from("system_health_logs").insert({
        source: "db_heartbeat",
        response_ms: ms,
        status: ms > 2000 ? "warning" : "ok",
        message: `DB heartbeat: ${ms}ms`,
      });

      results.heartbeat_ms = ms;
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
