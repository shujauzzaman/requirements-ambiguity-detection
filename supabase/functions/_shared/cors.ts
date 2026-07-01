export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Builds the Basic auth header Jira Cloud's REST API expects. */
export function jiraAuthHeader(email, apiToken) {
  const encoded = btoa(`${email}:${apiToken}`);
  return `Basic ${encoded}`;
}

/** Strips a trailing slash so we can safely do `${siteUrl}/rest/...` */
export function normalizeSiteUrl(siteUrl) {
  return siteUrl.replace(/\/+$/, "");
}