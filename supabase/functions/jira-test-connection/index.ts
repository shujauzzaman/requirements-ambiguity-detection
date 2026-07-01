// supabase/functions/jira-test-connection/index.js
//
// Validates a Jira site URL + email + API token by calling Jira's
// "myself" endpoint. Does NOT touch the database — just confirms the
// credentials work so the frontend can show a clear error before saving.
//
// Body: { site_url: string, email: string, api_token: string }
// Returns: { success: true, display_name } | { success: false, error }

import {
  corsHeaders,
  jsonResponse,
  jiraAuthHeader,
  normalizeSiteUrl,
} from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { site_url, email, api_token } = await req.json();

    if (!site_url || !email || !api_token) {
      return jsonResponse(
        { success: false, error: "site_url, email, and api_token are required." },
        400
      );
    }

    const baseUrl = normalizeSiteUrl(site_url);

    const jiraRes = await fetch(`${baseUrl}/rest/api/3/myself`, {
      method: "GET",
      headers: {
        Authorization: jiraAuthHeader(email, api_token),
        Accept: "application/json",
      },
    });

    if (jiraRes.status === 401) {
      return jsonResponse(
        { success: false, error: "Invalid email or API token." },
        200
      );
    }

    if (!jiraRes.ok) {
      const text = await jiraRes.text();
      return jsonResponse(
        {
          success: false,
          error: `Jira responded with ${jiraRes.status}. Check your site URL. (${text.slice(0, 200)})`,
        },
        200
      );
    }

    const data = await jiraRes.json();

    return jsonResponse({
      success: true,
      display_name: data.displayName,
      account_id: data.accountId,
    });
  } catch (err) {
    return jsonResponse(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});