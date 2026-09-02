// admin-provision-dashboard-user — Supabase Edge Function (BC-076-Card2a)
//
// Creates a new dashboard login (a real Supabase Auth user) and maps it
// to a client via dashboard_provision_user. Admin-only.
//
// Bootstrapping fact worth remembering: this function CANNOT create the
// very first admin (nothing is admin yet to authorize the call) — the
// first admin's dashboard_users row is set manually, same as every other
// dashboard user before self-serve provisioning existed. This function
// covers every admin action AFTER that one bootstrap step.
//
// Identity/authorization (D4): the caller's identity comes ONLY from
// their own session JWT (the Authorization header, forwarded
// automatically by supabase.functions.invoke() — same mechanism
// connection-lifecycle already relies on, confirmed live in that
// function's own comments). role='admin' is checked via
// dashboard_get_my_role(), called as the CALLER (anon-key client +
// their Authorization header), never trusted from the request body — a
// role/admin flag in the body is never read for authorization.
//
// Source is version-controlled per D5 (this project's existing Edge
// Functions are not — see connection-lifecycle's own header comment for
// that precedent; D5 breaks it only for this new admin-boundary function).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_ROLES = ["client_user", "admin"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: { code: "METHOD_NOT_ALLOWED" } });
  }

  // Identity check first (Codex adversarial review): reject unauthenticated
  // requests before spending any work parsing/validating the body.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(401, { error: { code: "NOT_AUTHENTICATED" } });
  }

  let body: { email?: string; client_id?: string; role?: string; remap?: boolean; confirm_auth_user_id?: string };
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse(400, { error: { code: "INVALID_JSON" } });
  }

  const { email, client_id, role } = body;
  const remap = body.remap === true;
  const confirmAuthUserId = body.confirm_auth_user_id;

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return jsonResponse(400, { error: { code: "INVALID_EMAIL" } });
  }
  if (!client_id || typeof client_id !== "string" || !UUID_RE.test(client_id)) {
    return jsonResponse(400, { error: { code: "INVALID_CLIENT_ID", message: "client_id must be a UUID" } });
  }
  if (!role || !VALID_ROLES.includes(role)) {
    return jsonResponse(400, { error: { code: "INVALID_ROLE", message: `role must be one of: ${VALID_ROLES.join(", ")}` } });
  }

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerRole, error: roleErr } = await callerClient.rpc("dashboard_get_my_role");
  if (roleErr || callerRole !== "admin") {
    // Deliberately the same shape whether the JWT is malformed, the caller
    // has no dashboard_users row, or they're a real but non-admin user —
    // never leaks which case it was.
    return jsonResponse(403, { error: { code: "ADMIN_REQUIRED" } });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Validate client_id actually exists before creating any Auth user for it.
  const { data: clientRow, error: clientErr } = await supabase
    .schema("control")
    .from("clients")
    .select("client_id")
    .eq("client_id", client_id)
    .maybeSingle();
  if (clientErr) {
    return jsonResponse(500, { error: { code: "CLIENT_LOOKUP_FAILED", message: clientErr.message } });
  }
  if (!clientRow) {
    return jsonResponse(400, { error: { code: "INVALID_CLIENT_ID", message: "No such client" } });
  }

  // Does an Auth user with this email already exist? Supabase's Admin API
  // has no direct "get by email" — list + filter is the documented path.
  // Paginated fully (Codex adversarial review: a fixed perPage silently
  // misses matches past page 1 once the user base grows).
  let existing: { id: string } | undefined;
  for (let page = 1; ; page++) {
    const { data: pageData, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (listErr) {
      return jsonResponse(500, { error: { code: "USER_LOOKUP_FAILED", message: listErr.message } });
    }
    existing = pageData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing || pageData.users.length < 1000) break;
  }

  let authUserId: string;
  let created: boolean;
  // Only set (and only ever returned) when a brand-new account is created
  // this call. This is a REAL, reusable password, not a single-use token
  // (Codex adversarial review caught the original comment/UI copy implying
  // otherwise — it's shown once in this response and never stored or
  // logged anywhere, but it stays valid until the user changes it). This
  // project has no confirmed-working SMTP for Supabase Auth invite emails,
  // so a generated password beats an unusable random UUID the account
  // could never actually log in with (an early draft's mistake, caught
  // before this shipped).
  let initialPassword: string | undefined;

  if (existing) {
    // Codex adversarial review: remap:true alone isn't a real confirmation
    // — any caller could send it blind on the first request, skipping the
    // "did you actually see whose account this is" step entirely. Require
    // confirm_auth_user_id to echo back the EXACT id from the 409 below,
    // proving this is a genuine second call, not a guessed flag.
    if (!remap || confirmAuthUserId !== existing.id) {
      // Distinct, actionable response — the UI can offer "remap this
      // existing user?" as an explicit confirm step rather than silently
      // reassigning someone's login to a different client.
      return jsonResponse(409, {
        error: {
          code: "USER_EXISTS",
          message: "An account with this email already exists. Resubmit with remap:true and confirm_auth_user_id set to the id below to confirm reassigning it to this client/role.",
          auth_user_id: existing.id,
        },
      });
    }
    authUserId = existing.id;
    created = false;
  } else {
    initialPassword = crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8);
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // internal/admin-created accounts skip email verification, matching the existing manual-creation convention
      password: initialPassword,
    });
    if (createErr || !newUser?.user) {
      return jsonResponse(500, { error: { code: "AUTH_CREATE_FAILED", message: createErr?.message ?? "no user returned" } });
    }
    authUserId = newUser.user.id;
    created = true;
  }

  const { error: provisionErr } = await supabase.rpc("dashboard_provision_user", {
    p_auth_user_id: authUserId,
    p_client_id: client_id,
    p_role: role,
  });
  if (provisionErr) {
    // Codex adversarial review: without this, a brand-new Auth user with a
    // real working password could be left behind with no dashboard_users
    // mapping at all — a confirmed login nobody can find or use correctly.
    // Only compensate for users THIS call created — never delete an
    // existing account just because a remap failed.
    if (created) {
      await supabase.auth.admin.deleteUser(authUserId);
    }
    return jsonResponse(500, { error: { code: "PROVISION_FAILED", message: provisionErr.message } });
  }

  return jsonResponse(200, {
    result: { auth_user_id: authUserId, client_id, role, created, initial_password: initialPassword },
  });
});
