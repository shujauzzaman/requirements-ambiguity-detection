// supabase/functions/jira-create-issue/index.js
//
// Pushes a single requirement to Jira as a new issue.
// - Verifies the caller's identity from their auth JWT (so one user
//   can't push requirements belonging to another user's project).
// - Uses the SERVICE ROLE key to read the stored Jira credentials,
//   since normal clients are blocked from selecting api_token by RLS.
// - Idempotent: if the requirement already has a jira_issue_key, it
//   just returns the existing issue instead of creating a duplicate.
//
// Body: { requirement_id: string }
// Returns: { success: true, issue_key, issue_url } | { success: false, error }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonResponse,
  jiraAuthHeader,
  normalizeSiteUrl,
} from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

function buildDescriptionADF(req) {
  const content = [];

  const userStoryText = req.generated_user_story || req.story_text || "";
  content.push(
    {
      type: "paragraph",
      content: [{ type: "text", text: "User Story:", marks: [{ type: "strong" }] }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: userStoryText }],
    }
  );

  if (Array.isArray(req.acceptance_criteria) && req.acceptance_criteria.length > 0) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: "✅ Acceptance Criteria:", marks: [{ type: "strong" }] }],
    });
    content.push({
      type: "bulletList",
      content: req.acceptance_criteria.map((ac) => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: ac }] }],
      })),
    });
  }

  content.push({
    type: "paragraph",
    content: [
      { type: "text", text: "Created automatically from Req-Analyzer.", marks: [{ type: "em" }] },
    ],
  });

  return { type: "doc", version: 1, content };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Missing Authorization header." }, 401);
    }

    // Client scoped to the caller's JWT — used only to confirm who's asking.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ success: false, error: "Invalid or expired session." }, 401);
    }

    const { requirement_id } = await req.json();
    if (!requirement_id) {
      return jsonResponse({ success: false, error: "requirement_id is required." }, 400);
    }

    // Service-role client — bypasses RLS, so we manually check ownership below.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: requirement, error: reqError } = await admin
      .from("requirements")
      .select("*")
      .eq("id", requirement_id)
      .single();

    if (reqError || !requirement) {
      return jsonResponse({ success: false, error: "Requirement not found." }, 404);
    }

    // Already pushed — return the existing issue instead of duplicating.
    if (requirement.jira_issue_key) {
      return jsonResponse({
        success: true,
        issue_key: requirement.jira_issue_key,
        issue_url: requirement.jira_issue_url,
        already_existed: true,
      });
    }

    const { data: connection, error: connError } = await admin
      .from("jira_connections")
      .select("*")
      .eq("project_id", requirement.project_id)
      .single();

    if (connError || !connection) {
      return jsonResponse(
        { success: false, error: "No Jira connection configured for this project." },
        400
      );
    }

    // Ownership check — the caller must own the project this connection belongs to.
    if (connection.user_id !== user.id) {
      return jsonResponse({ success: false, error: "Not authorized for this project." }, 403);
    }

    const baseUrl = normalizeSiteUrl(connection.site_url);
    const summarySource = requirement.generated_user_story || requirement.story_text;
    const summary =
      summarySource.length > 250 ? summarySource.slice(0, 247) + "..." : summarySource;

    const issuePayload = {
      fields: {
        project: { key: connection.jira_project_key },
        summary,
        description: buildDescriptionADF(requirement),
        issuetype: { name: connection.issue_type || "Story" },
      },
    };

    const jiraRes = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: jiraAuthHeader(connection.email, connection.api_token),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(issuePayload),
    });

    if (!jiraRes.ok) {
      const errBody = await jiraRes.text();
      return jsonResponse(
        { success: false, error: `Jira rejected the issue (${jiraRes.status}): ${errBody.slice(0, 300)}` },
        200
      );
    }

    const created = await jiraRes.json();
    const issueKey = created.key;
    const issueUrl = `${baseUrl}/browse/${issueKey}`;

    const { error: updateError } = await admin
      .from("requirements")
      .update({
        jira_issue_key: issueKey,
        jira_issue_url: issueUrl,
        jira_pushed_at: new Date().toISOString(),
      })
      .eq("id", requirement_id);

    if (updateError) {
      // Issue WAS created in Jira even though our DB write failed — surface both.
      return jsonResponse({
        success: true,
        issue_key: issueKey,
        issue_url: issueUrl,
        warning: "Issue created in Jira, but failed to save status locally.",
      });
    }

    return jsonResponse({ success: true, issue_key: issueKey, issue_url: issueUrl });
  } catch (err) {
    return jsonResponse(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});