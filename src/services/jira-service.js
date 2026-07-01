// services/jira-service.js
import { supabase } from "../auth/supabaseClient";

/** Fetch the Jira connection for a project (null if none configured yet). */
export async function getJiraConnection(projectId) {
  const { data, error } = await supabase
    .from("jira_connections")
    .select("id, site_url, email, jira_project_key, issue_type, account_display_name, created_at")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  return data; // null if not connected — note api_token is never selected here
}

/** Validate credentials against Jira before saving anything. */
export async function testJiraConnection({ site_url, email, api_token }) {
  const { data, error } = await supabase.functions.invoke("jira-test-connection", {
    body: { site_url, email, api_token },
  });
  if (error) throw error;
  return data; // { success, display_name } or { success: false, error }
}

/** Create or replace the Jira connection for a project. */
export async function saveJiraConnection(projectId, userId, connection) {
  const { site_url, email, api_token, jira_project_key, issue_type, account_display_name } =
    connection;

  const { data, error } = await supabase
    .from("jira_connections")
    .upsert(
      {
        project_id: projectId,
        user_id: userId,
        site_url,
        email,
        api_token,
        jira_project_key,
        issue_type: issue_type || "Story",
        account_display_name: account_display_name || null,
      },
      { onConflict: "project_id" }
    )
    .select("id, site_url, email, jira_project_key, issue_type, account_display_name")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteJiraConnection(projectId) {
  const { error } = await supabase.from("jira_connections").delete().eq("project_id", projectId);
  if (error) throw error;
}

/** Push a single requirement to Jira. Safe to call repeatedly — server is idempotent. */
export async function pushRequirementToJira(requirementId) {
  const { data, error } = await supabase.functions.invoke("jira-create-issue", {
    body: { requirement_id: requirementId },
  });
  if (error) throw error;
  return data; // { success, issue_key, issue_url } or { success: false, error }
}

/**
 * Push every eligible requirement (approved, not yet pushed) for a project.
 * Runs sequentially to stay friendly to Jira's rate limits and to report
 * progress incrementally via onProgress(completed, total).
 */
export async function pushAllApprovedToJira(requirements, onProgress) {
  const eligible = requirements.filter((r) => r.status === "approved" && !r.jira_issue_key);
  const results = [];

  for (let i = 0; i < eligible.length; i++) {
    const req = eligible[i];
    try {
      const result = await pushRequirementToJira(req.id);
      results.push({ requirement_id: req.id, ...result });
    } catch (err) {
      results.push({ requirement_id: req.id, success: false, error: err.message });
    }
    if (onProgress) onProgress(i + 1, eligible.length);
  }

  return results;
}