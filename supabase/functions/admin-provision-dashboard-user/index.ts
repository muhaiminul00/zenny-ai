// admin-provision-dashboard-user — Supabase Edge Function
// BC-076-Card2a (original map_existing path) + Admin Provisioning
// Bootstrap (create_client / create_admin actions, T5).
//
// Bootstrapping fact worth remembering: this function CANNOT create the
// very first admin (nothing is admin yet to authorize the call) — the
// first admin's dashboard_users row is set manually, same as every other
// dashboard user before self-serve provisioning existed. This function
// covers every admin action AFTER that one bootstrap step.
//
// Identity/authorization (D4, Card2a): the caller's identity comes ONLY
// from their own session JWT (the Authorization header, forwarded
// automatically by supabase.functions.invoke()). Role AND
// must_change_password are checked via dashboard_get_my_flags(), called
// as the CALLER (anon-key client + their Authorization header), never
// trusted from the request body — a role/admin flag in the body is never
// read for authorization, and a caller still holding their temp password
// is rejected before any action-specific logic runs.
//
// Admin-Provisioning-Bootstrap adds a 3rd action and closes a real risk
// that Card2a's original map_existing path left open: previously any
// 'admin' caller could mint another 'admin' through map_existing's own
// role field. That path is now restricted to role='client_user' only —
// minting an admin/super_admin requires the new create_admin action,
// which itself requires the CALLER to already be 'super_admin'.
//
// Source is version-controlled per D5 (this project's other Edge
// Functions are not — see connection-lifecycle's own header comment for
// that precedent; D5 breaks it only for this admin-boundary function).
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
const MAP_EXISTING_ROLES = ["client_user"];
const CREATE_ADMIN_ROLES = ["admin", "super_admin"];

type Action = "map_existing" | "create_client" | "create_admin";

interface RequestBody {
  action?: Action;
  email?: string;
  role?: string;
  remap?: boolean;
  confirm_auth_user_id?: string;
  // map_existing
  client_id?: string;
  // create_client
  business_name?: string;
  billing_tier?: string;
  // create_admin has no fields of its own -- admin/super_admin accounts
  // never have a client (see Admin Provisioning UI client-picker fix,
  // 2026-09-02); it only needs `role` (above) + the shared fields.
}

// Finds an existing Auth user by email. Supabase's Admin API has no
// direct "get by email" — list + filter is the documented path,
// paginated fully (Codex adversarial review on Card2a: a fixed perPage
// silently misses matches past page 1 once the user base grows).
async function findUserByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
): Promise<{ id: string } | undefined> {
  for (let page = 1; ; page++) {
    const { data: pageData, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (listErr) throw new Error(`USER_LOOKUP_FAILED: ${listErr.message}`);
    const found = pageData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (pageData.users.length < 1000) return undefined;
  }
}

// Security guard shared by map_existing and create_client's remap paths
// (client-picker fix PR, adversarial review): both actions can remap an
// EXISTING auth user to role='client_user' via a 409-then-remap round
// trip, and dashboard_provision_user's upsert has no notion of "current
// role" -- it just overwrites both client_id and role unconditionally.
// Neither action's own caller gate requires super_admin specifically (both
// accept plain 'admin'), so without this check any 'admin' could silently
// strip the platform's only super_admin (or any admin) down to a client
// login in two API calls. Returns a 403 Response if the target is
// currently admin-tier, otherwise null (caller proceeds normally).
//
// Routes through dashboard_get_user_role() (SECURITY DEFINER,
// service_role-only) rather than a direct table select -- control.
// dashboard_users has ZERO service_role table grants (unlike
// control.clients), confirmed live: a direct .schema("control")
// .from("dashboard_users").select() 500s with "permission denied for
// table dashboard_users" even under the service-role key. Same pattern
// as dashboard_provision_user/dashboard_set_provisioning_audit.
async function rejectIfTargetIsAdminTier(
  supabase: ReturnType<typeof createClient>,
  targetAuthUserId: string,
): Promise<Response | null> {
  const { data: targetRole, error: targetErr } = await supabase.rpc("dashboard_get_user_role", {
    p_auth_user_id: targetAuthUserId,
  });
  if (targetErr) return jsonResponse(500, { error: { code: "TARGET_LOOKUP_FAILED", message: targetErr.message } });
  if (targetRole && targetRole !== "client_user") {
    return jsonResponse(403, {
      error: {
        code: "CANNOT_REMAP_ADMIN_TIER",
        message: "This account is currently admin-tier. It cannot be remapped to a client login through this action.",
      },
    });
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: { code: "METHOD_NOT_ALLOWED" } });
  }

  // Identity check first (Codex adversarial review, Card2a): reject
  // unauthenticated requests before spending any work parsing the body.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(401, { error: { code: "NOT_AUTHENTICATED" } });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse(400, { error: { code: "INVALID_JSON" } });
  }

  const action: Action = body.action ?? "map_existing";
  if (!["map_existing", "create_client", "create_admin"].includes(action)) {
    return jsonResponse(400, { error: { code: "INVALID_ACTION" } });
  }

  const { email } = body;
  const remap = body.remap === true;
  const confirmAuthUserId = body.confirm_auth_user_id;

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return jsonResponse(400, { error: { code: "INVALID_EMAIL" } });
  }

  // Caller's own role + must_change_password, from their JWT only —
  // never the request body. Codex adversarial review: checking role
  // alone let a freshly-provisioned admin/super_admin still holding
  // their admin-set temp password perform privileged actions (mint more
  // admins, create clients) before ever proving they own the account via
  // a real password change — closing that here, not just at the React
  // route-guard level (same principle as D4/T8's own enforcement point).
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerFlags, error: flagsErr } = await callerClient.rpc("dashboard_get_my_flags");
  if (flagsErr || !callerFlags || typeof callerFlags !== "object") {
    // Deliberately the same shape whether the JWT is malformed or the
    // caller has no dashboard_users row — never leaks which case it was.
    return jsonResponse(403, { error: { code: "ADMIN_REQUIRED" } });
  }
  const callerRole = (callerFlags as { role?: string }).role;
  const callerMustChangePassword = (callerFlags as { must_change_password?: boolean }).must_change_password === true;
  if (typeof callerRole !== "string") {
    return jsonResponse(403, { error: { code: "ADMIN_REQUIRED" } });
  }
  if (callerMustChangePassword) {
    return jsonResponse(403, {
      error: { code: "MUST_CHANGE_PASSWORD_FIRST", message: "Change your temporary password before performing admin actions." },
    });
  }

  // Per-action authorization gate. create_admin requires super_admin
  // specifically — this is the risk closure this card exists to ship.
  if (action === "create_admin") {
    if (callerRole !== "super_admin") {
      return jsonResponse(403, { error: { code: "SUPER_ADMIN_REQUIRED" } });
    }
  } else {
    if (!["admin", "super_admin"].includes(callerRole)) {
      return jsonResponse(403, { error: { code: "ADMIN_REQUIRED" } });
    }
  }

  // Who is performing this write, for the created_by audit columns (T4).
  const { data: callerUser } = await callerClient.auth.getUser();
  const callerAuthUserId = callerUser?.user?.id;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    if (action === "map_existing") {
      const { client_id, role } = body;
      if (!client_id || typeof client_id !== "string" || !UUID_RE.test(client_id)) {
        return jsonResponse(400, { error: { code: "INVALID_CLIENT_ID", message: "client_id must be a UUID" } });
      }
      if (!role || !MAP_EXISTING_ROLES.includes(role)) {
        // Minting admin/super_admin no longer goes through this action —
        // closes the risk this card was scoped to fix.
        return jsonResponse(400, {
          error: {
            code: "INVALID_ROLE",
            message: `role must be one of: ${MAP_EXISTING_ROLES.join(", ")}. To create an admin, use action "create_admin".`,
          },
        });
      }

      const { data: clientRow, error: clientErr } = await supabase
        .schema("control")
        .from("clients")
        .select("client_id")
        .eq("client_id", client_id)
        .maybeSingle();
      if (clientErr) return jsonResponse(500, { error: { code: "CLIENT_LOOKUP_FAILED", message: clientErr.message } });
      if (!clientRow) return jsonResponse(400, { error: { code: "INVALID_CLIENT_ID", message: "No such client" } });

      const existing = await findUserByEmail(supabase, email);

      // Security fix (client-picker fix PR, adversarial review): checked
      // BEFORE the remap-confirmation flow below, not just at write time,
      // so an admin-tier account is never even offered for remap through
      // this path. See rejectIfTargetIsAdminTier's own comment for why.
      if (existing) {
        const rejection = await rejectIfTargetIsAdminTier(supabase, existing.id);
        if (rejection) return rejection;
      }

      if (existing && (!remap || confirmAuthUserId !== existing.id)) {
        return jsonResponse(409, {
          error: {
            code: "USER_EXISTS",
            message: "An account with this email already exists. Resubmit with remap:true and confirm_auth_user_id set to the id below to confirm reassigning it to this client/role.",
            auth_user_id: existing.id,
          },
        });
      }

      let authUserId: string;
      let created: boolean;
      let initialPassword: string | undefined;
      if (existing) {
        authUserId = existing.id;
        created = false;
      } else {
        initialPassword = crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8);
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
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
        if (created) {
          const { error: rollbackErr } = await supabase.auth.admin.deleteUser(authUserId);
          if (rollbackErr) console.error("map_existing rollback (deleteUser) failed:", rollbackErr.message, "orphaned auth_user_id:", authUserId);
        }
        return jsonResponse(500, { error: { code: "PROVISION_FAILED", message: provisionErr.message } });
      }

      const { error: auditErr } = await supabase.rpc("dashboard_set_provisioning_audit", {
        p_auth_user_id: authUserId,
        p_created_by: callerAuthUserId ?? null,
        p_must_change_password: created,
      });
      if (auditErr) {
        // Non-fatal: the real provisioning (Auth user + mapping) already
        // succeeded. Surface it rather than silently drop it (this
        // exact silent-failure shape — a direct table UPDATE against a
        // service_role-ungranted table — is the bug this RPC replaced).
        console.error("dashboard_set_provisioning_audit failed:", auditErr.message);
      }

      return jsonResponse(200, {
        result: { auth_user_id: authUserId, client_id, role, created, initial_password: initialPassword },
      });
    }

    if (action === "create_client") {
      const { business_name } = body;
      const billingTier = body.billing_tier && body.billing_tier.trim() ? body.billing_tier.trim() : "standard";
      if (!business_name || typeof business_name !== "string" || !business_name.trim()) {
        return jsonResponse(400, { error: { code: "INVALID_BUSINESS_NAME" } });
      }

      // Duplicate-email checked before ANY write (Issue 3 / T5 spec).
      const existing = await findUserByEmail(supabase, email);

      // Security fix (client-picker fix PR, adversarial review): same guard
      // as map_existing -- this action's remap path can also flip an
      // existing admin/super_admin's row to client_user for a new client.
      if (existing) {
        const rejection = await rejectIfTargetIsAdminTier(supabase, existing.id);
        if (rejection) return rejection;
      }

      if (existing && (!remap || confirmAuthUserId !== existing.id)) {
        return jsonResponse(409, {
          error: {
            code: "USER_EXISTS",
            message: "An account with this email already exists. Resubmit with remap:true and confirm_auth_user_id set to the id below to confirm reassigning it to the new client.",
            auth_user_id: existing.id,
          },
        });
      }

      // Write order (Issue 3): client row -> Auth user -> mapping, cheapest
      // rollback first. status='unprovisioned' (D1) -- archetype/schema are
      // both unknown until the client's own onboarding decides them (a
      // later, separate effort per the design doc's own key insight).
      const { data: newClient, error: clientInsertErr } = await supabase
        .schema("control")
        .from("clients")
        .insert({
          business_name: business_name.trim(),
          status: "unprovisioned",
          billing_tier: billingTier,
          archetype: null,
          client_schema_name: null,
          created_date: new Date().toISOString().slice(0, 10),
          created_by: callerAuthUserId ?? null,
        })
        .select("client_id")
        .single();
      if (clientInsertErr || !newClient) {
        return jsonResponse(500, { error: { code: "CLIENT_CREATE_FAILED", message: clientInsertErr?.message ?? "no row returned" } });
      }
      const newClientId = newClient.client_id as string;

      let authUserId: string;
      let created: boolean;
      let initialPassword: string | undefined;
      if (existing) {
        authUserId = existing.id;
        created = false;
      } else {
        initialPassword = crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8);
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          password: initialPassword,
        });
        if (createErr || !newUser?.user) {
          // Rollback: delete the client row (Issue 3).
          const { error: rollbackErr } = await supabase.schema("control").from("clients").delete().eq("client_id", newClientId);
          if (rollbackErr) console.error("create_client rollback (client row) failed:", rollbackErr.message, "orphaned client_id:", newClientId);
          return jsonResponse(500, { error: { code: "AUTH_CREATE_FAILED", message: createErr?.message ?? "no user returned" } });
        }
        authUserId = newUser.user.id;
        created = true;
      }

      const { error: provisionErr } = await supabase.rpc("dashboard_provision_user", {
        p_auth_user_id: authUserId,
        p_client_id: newClientId,
        p_role: "client_user",
      });
      if (provisionErr) {
        if (created) {
          const { error: userRollbackErr } = await supabase.auth.admin.deleteUser(authUserId);
          if (userRollbackErr) console.error("create_client rollback (deleteUser) failed:", userRollbackErr.message, "orphaned auth_user_id:", authUserId);
        }
        const { error: clientRollbackErr } = await supabase.schema("control").from("clients").delete().eq("client_id", newClientId);
        if (clientRollbackErr) console.error("create_client rollback (client row) failed:", clientRollbackErr.message, "orphaned client_id:", newClientId);
        return jsonResponse(500, { error: { code: "PROVISION_FAILED", message: provisionErr.message } });
      }

      const { error: auditErr } = await supabase.rpc("dashboard_set_provisioning_audit", {
        p_auth_user_id: authUserId,
        p_created_by: callerAuthUserId ?? null,
        p_must_change_password: created,
      });
      if (auditErr) {
        console.error("dashboard_set_provisioning_audit failed:", auditErr.message);
      }

      return jsonResponse(200, {
        result: {
          client_id: newClientId,
          auth_user_id: authUserId,
          role: "client_user",
          created,
          initial_password: initialPassword,
        },
      });
    }

    // action === "create_admin"
    // Admin Provisioning UI client-picker fix (2026-09-02): admin/super_admin
    // accounts never have a client -- dashboard_users.client_id is now
    // nullable with a strict CHECK enforcing exactly that (see migration
    // dashboard_users_client_id_role_check). No client lookup/validation
    // needed here at all -- this branch used to require a "nominal home
    // client" purely to satisfy the old NOT NULL constraint.
    const { role } = body;
    if (!role || !CREATE_ADMIN_ROLES.includes(role)) {
      return jsonResponse(400, { error: { code: "INVALID_ROLE", message: `role must be one of: ${CREATE_ADMIN_ROLES.join(", ")}` } });
    }

    const existing = await findUserByEmail(supabase, email);
    if (existing && (!remap || confirmAuthUserId !== existing.id)) {
      return jsonResponse(409, {
        error: {
          code: "USER_EXISTS",
          message: "An account with this email already exists. Resubmit with remap:true and confirm_auth_user_id set to the id below to confirm reassigning it to this admin role.",
          auth_user_id: existing.id,
        },
      });
    }

    let authUserId: string;
    let created: boolean;
    let initialPassword: string | undefined;
    if (existing) {
      authUserId = existing.id;
      created = false;
    } else {
      initialPassword = crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
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
      p_client_id: null,
      p_role: role,
    });
    if (provisionErr) {
      if (created) {
        const { error: rollbackErr } = await supabase.auth.admin.deleteUser(authUserId);
        if (rollbackErr) console.error("create_admin rollback (deleteUser) failed:", rollbackErr.message, "orphaned auth_user_id:", authUserId);
      }
      return jsonResponse(500, { error: { code: "PROVISION_FAILED", message: provisionErr.message } });
    }

    const { error: auditErr } = await supabase.rpc("dashboard_set_provisioning_audit", {
      p_auth_user_id: authUserId,
      p_created_by: callerAuthUserId ?? null,
      p_must_change_password: created,
    });
    if (auditErr) {
      console.error("dashboard_set_provisioning_audit failed:", auditErr.message);
    }

    return jsonResponse(200, {
      result: { auth_user_id: authUserId, client_id: null, role, created, initial_password: initialPassword },
    });
  } catch (e) {
    return jsonResponse(500, { error: { code: "UNEXPECTED", message: e instanceof Error ? e.message : String(e) } });
  }
});
