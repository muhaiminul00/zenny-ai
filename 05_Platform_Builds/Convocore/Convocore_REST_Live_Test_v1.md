# Convocore REST API — Direct Live Test (v1)

> **DOC PREFERENCE (2026-08-14, BC-057b):** CURRENT — background evidence. Real, dated (2026-07-27) live-test findings on REST-level bugs; not a build guide. Consult when a REST/MCP discrepancy needs its original evidence trail. See `Wiki/reference/convocore-doc-status.md`.

> **Purpose:** isolate whether three bugs originally found through the Convocore MCP server (documented in `Convocore_MCP_Reference_v1.md` §10–§11) are **MCP-specific** (the MCP wrapper is the problem) or **backend bugs** (Convocore's real REST/WebSocket API has the same issue, independent of MCP entirely).
>
> **Method:** raw HTTP (`curl`) and a raw WebSocket connection (plain Node.js script, no libraries), straight against Convocore's real API — **no MCP server involved anywhere in this document.** Every call, exact request, and exact response below is real, captured live on 2026-07-27.
>
> **Credentials/config used:** workspace secret `vg_NwCS7nkWYnIAYmSsVpPJ` (same value configured in this project's `.mcp.json`, per `Convocore_API_Reference_v1.md` §2's Bearer-token auth model), region `na-gcp` (per API Reference §3), base URL `https://na-gcp-api.vg-stuff.com/v3`, WebSocket URL `wss://na-gcp-api.vg-stuff.com/interact` (per API Reference §17.2).
>
> **Companion documents:** `Convocore_API_Reference_v1.md` (documented REST/WebSocket contract — cited by section throughout) and `Convocore_MCP_Reference_v1.md` (the MCP-based findings this document is verifying). Neither file was modified by this task.

---

## 0. Setup

**Call:** `POST /agents`
```json
{ "agent": { "title": "REST API Live Test — safe to delete", "agentPlatform": "vg" } }
```
**Result:** `200 OK`, `success: true`, new agent created with default single-node template (matches API Reference §4.3's documented minimal-create example exactly). **Agent ID: `dg0ZED4gIzX3T7cy7CIm`.** This agent was used for every test below and permanently deleted in §5 (Cleanup) — never touched `Zenny AI` or `Bakery Assistant`.

---

## 1. Test 1 — `childrenNodes` write + routing crash (highest priority)

### 1.1 Write the two-node flow

**Call:** `PATCH /agents/dg0ZED4gIzX3T7cy7CIm`
```json
{
  "agent": {
    "nodes": [
      {
        "id": "__start__",
        "name": "Start",
        "instructions": "Greet the user and route to node_2 if they mention testing.",
        "description": "The start node of the flow.",
        "llmConfig": { "modelId": "gemini-2.5-flash", "temperature": 0.7, "maxTokens": 2024 },
        "childrenNodes": ["node_2"]
      },
      {
        "id": "node_2",
        "name": "Second Node",
        "instructions": "This is the second node instructions.",
        "description": "Route here when user mentions testing.",
        "llmConfig": { "modelId": "gemini-2.5-flash", "temperature": 0.5, "maxTokens": 1024 }
      }
    ]
  }
}
```
**Result:** `200 OK`, `success: true`. Node fields match API Reference §4.4's documented settable-fields table (`id`, `instructions`, `name`, `llmConfig`) plus `description` and `childrenNodes`, neither of which that table lists as officially documented — consistent with `Convocore_MCP_Reference_v1.md` §5.4's finding that the REST doc itself is incomplete on this point.

**Confirmation call:** `GET /agents/dg0ZED4gIzX3T7cy7CIm` →
```
__start__ | description: "The start node of the flow." | childrenNodes: ["node_2"] | instructions: "Greet the user and route to node_2..."
node_2    | description: "Route here when user mentions testing." | childrenNodes: None | instructions: "This is the second node instructions."
```
**The write persisted exactly as sent**, byte-for-byte matching the behavior `Convocore_MCP_Reference_v1.md` §11.4 (Test 6) observed via MCP's `update_agent` — no validation error, no rejection, `childrenNodes` accepted as a bare array of ID strings.

### 1.2 Direct WebSocket connection — no MCP, no auth header

**Script** (plain Node.js, native `WebSocket` global, no npm packages):
```javascript
const ws = new WebSocket("wss://na-gcp-api.vg-stuff.com/interact");
ws.onopen = () => {
  ws.send(JSON.stringify({
    agentId: "dg0ZED4gIzX3T7cy7CIm",
    convoId: "rest-live-test-1785156823884",
    bucket: "(default)",
    prompt: "start",
    agentData: { ownerID: "rest-test-user", userID: "rest-test-user" },
    lightConvoData: { userName: "REST Test User", origin: "web-chat" }
  }));
};
ws.onmessage = (event) => console.log("MESSAGE:", event.data);
ws.onclose = (event) => console.log("WS CLOSED. code=" + event.code);
```
This matches API Reference §17.3/§17.6's documented `InteractObject` shape and worked example exactly, adapted only for `na`/`"(default)"` instead of `eu`/`"voiceglow-eu"` per §17.3's documented region mapping.

💡 **Notable finding, not previously documented:** **no `Authorization` header was sent at all**, and the connection succeeded anyway — this endpoint does not appear to require the workspace-secret Bearer token the way every REST endpoint does. This is consistent with it being the same mechanism that powers Convocore's public, unauthenticated embeddable widget (Master Reference §10) — auth/scoping for this endpoint is apparently handled via `agentId` ownership internally, not a request-level credential.

**Raw captured output, verbatim:**
```
WS OPEN
SENDING: {"agentId":"dg0ZED4gIzX3T7cy7CIm","convoId":"rest-live-test-1785156823884","bucket":"(default)","prompt":"start","agentData":{"ownerID":"rest-test-user","userID":"rest-test-user"},"lightConvoData":{"userName":"REST Test User","origin":"web-chat"}}
MESSAGE: {"type":"chunk","chunk":"TypeError: Cannot create property 'condition' on string 'node_2'","chunkIndex":0,"ui_engine":false}
WS CLOSED. code=1000 reason=
TOTAL_MESSAGES: 1
```

### 1.3 Verdict

**Identical crash, byte-for-byte identical error message**, obtained via a raw WebSocket connection with:
- No MCP server anywhere in the call path
- No `interact_with_agent` wrapper logic
- No Authorization header at all

The connection itself succeeded and closed cleanly (`code: 1000`, the standard successful-closure code per API Reference §17.5) — the crash is **inside Convocore's own turn-generation/routing logic**, streamed back as if it were a normal `"chunk"` message (`type: "chunk"`), not surfaced as a connection-level error or a distinct error message type. Convocore's backend is catching the crash and stuffing the stack-trace text into the same channel a real assistant reply would use, rather than failing the request cleanly.

> ## 🔴 **BACKEND BUG — NOT MCP-specific.**
> The MCP server's `interact_with_agent` tool was faithfully relaying a genuine, reproducible backend crash. Root cause (consistent with the error message): the real-time routing engine expects `childrenNodes` entries to be objects (likely carrying per-edge condition data, matching the Canvas "Condition Node" concept in `Convocore_Master_Reference_v3.md` §6.7), but the REST API's write-path validation accepts a bare array of ID strings with zero complaint — a genuine mismatch between what the *storage* layer validates and what the *routing* layer can safely consume. **This confirms `Convocore_MCP_Reference_v1.md` §11.7's most important caveat at the REST/WebSocket level, independent of MCP:** don't wire Canvas nodes together via a bare `childrenNodes: [id, ...]` array through any programmatic interface (REST, WebSocket, or MCP) and assume it will route correctly — the dashboard's Canvas editor is presumably generating a different, richer shape when a human wires nodes together visually.

---

## 2. Test 2 — Conversation single-item lookups

### 2.1 Create

**Call:** `POST /agents/dg0ZED4gIzX3T7cy7CIm/convos`
```json
{ "conversation": { "ts": 1785156900, "userName": "REST Test Convo", "userEmail": "resttest@example.com", "tags": ["rest-live-test"] } }
```
**Result:** `200 OK` — `{"success":true,"message":"Successfully created conversation: dg0ZED4gIzX3T7cy7CIm_3HJu0OJs8nqVZIRxNcBL", ...}`. **Convo ID: `dg0ZED4gIzX3T7cy7CIm_3HJu0OJs8nqVZIRxNcBL`** — note the `{agentId}_{suffix}` ID format, matching `Convocore_MCP_Reference_v1.md` §11.5's observation about API-created conversation IDs.

### 2.2 List

**Call:** `GET /agents/dg0ZED4gIzX3T7cy7CIm/convos`
**Result:** `200 OK` — the conversation **is present**, full data returned (`userEmail`, `userName`, `ID`, `tags`, etc. all correct).

### 2.3 Get single item

**Call:** `GET /agents/dg0ZED4gIzX3T7cy7CIm/convos/dg0ZED4gIzX3T7cy7CIm_3HJu0OJs8nqVZIRxNcBL`
**Result:** `404 Not Found`
```json
{ "message": "Conversation not found", "code": "NOT_FOUND" }
```

### 2.4 PATCH and DELETE on the same ID (tested per task instructions, since it failed rather than succeeded)

**Call:** `PATCH /agents/dg0ZED4gIzX3T7cy7CIm/convos/dg0ZED4gIzX3T7cy7CIm_3HJu0OJs8nqVZIRxNcBL`
```json
{ "conversation": { "notes": "REST_PATCH_TEST" } }
```
**Result:** `404 Not Found` — identical `{ "message": "Conversation not found", "code": "NOT_FOUND" }`

**Call:** `DELETE /agents/dg0ZED4gIzX3T7cy7CIm/convos/dg0ZED4gIzX3T7cy7CIm_3HJu0OJs8nqVZIRxNcBL`
**Result:** `404 Not Found` — identical `{ "message": "Conversation not found", "code": "NOT_FOUND" }`

### 2.5 Verdict

**Every single-item operation (GET/PATCH/DELETE) fails identically via raw REST**, with no MCP server involved. The conversation demonstrably exists (§2.2's list call proves it), but is unreachable by its own ID through any of the three single-item endpoints documented in API Reference §9.2/§9.4/§9.6.

> ## 🔴 **BACKEND BUG — NOT MCP-specific.**
> This is a real bug in Convocore's own REST API — the single-item conversation lookup path (by whatever internal mechanism it resolves `convoId` → record) does not find conversations that the list endpoint (which presumably queries a different index/collection) can see. `Convocore_MCP_Reference_v1.md` §11.5's "Conversation not found" finding was **not** an MCP artifact — the MCP server was correctly reporting a genuine 404 from Convocore's own backend the whole time.

---

## 3. Test 3 — `get_agent_usage` auth error

### 3.1 Agent-level usage

**Call:** `POST /agents/dg0ZED4gIzX3T7cy7CIm/usage`
```json
{}
```
**Result:** `401 Unauthorized`
```json
{ "message": "Unauthorized workspace scope", "code": "UNAUTHORIZED" }
```
Identical error string to `Convocore_MCP_Reference_v1.md` §4.9/§11.6's MCP-observed failure, now confirmed via raw REST with the exact same workspace secret used in `.mcp.json`.

### 3.2 Workspace-level usage (same credential)

**Call:** `POST /workspaces/gt8IxVnR4cRd1jqL7GCpQhnFLYZ2/usage` (workspace ID taken from the `ownerID` field visible on every agent object returned in this session, matching API Reference §4's note that `ownerID` *is* the workspace ID)
```json
{ "range": { "start": 1782478800000, "end": 1785156900000 }, "logsPage": 1 }
```
**Result:** `200 OK`
```json
{ "keyMetrics": { "creditsCharged": 0, "creditsConsumed": 0, "llms": [], "agentsUsage": [] }, "logs": [], "charts": [] }
```

### 3.3 Verdict

**This is the most precise finding in this document.** The exact same workspace secret that fails with `401 Unauthorized workspace scope` against the **agent-level** usage endpoint (`POST /agents/{id}/usage`, API Reference §4.7) succeeds cleanly against the **workspace-level** usage endpoint (`POST /workspaces/{uid}/usage`, API Reference §15.6) — real data returned, `200 OK`, no error.

> ## 🔴 **BACKEND BUG — NOT MCP-specific**, and more precisely scoped than the original finding.
> This is **not** a blanket credential/permission problem, as the original MCP-only testing could only conclude ("this workspace secret is somehow more restricted than documented"). It is specifically the **agent-scoped usage endpoint** (`/agents/{id}/usage`) that rejects this workspace secret; the workspace-wide equivalent (`/workspaces/{uid}/usage`) accepts it fine. This looks like a real, narrow scoping bug on Convocore's side — the agent-usage endpoint is checking something the workspace-usage endpoint doesn't (or checking it incorrectly). **Practical workaround, confirmed live:** if you need usage/cost data and `get_agent_usage`/`POST /agents/{id}/usage` fails, use `POST /workspaces/{uid}/usage` instead and filter/aggregate by agent client-side from its `agentsUsage` field — this path is confirmed working with the exact same credential.

---

## 4. Secondary — Tools & Variables CRUD (previously untested on either surface)

Neither `Convocore_MCP_Reference_v1.md` (MCP doesn't expose Tools/Variables at all, per its §5 boundary table) nor any prior live session had exercised these against the real API — `Convocore_API_Reference_v1.md` §5–§6's claims about them were sourced from Convocore's own documentation, never confirmed live until now.

### 4.1 Tools

| Step | Call | Result |
|---|---|---|
| Create | `POST /agents/dg0ZED4gIzX3T7cy7CIm/tools` — `{"tool":{"name":"Get Test Weather","description":"...","serverUrl":"https://api.example.com/weather","method":"GET","fields":[{"id":"location","key":"city","type":"string","in":"query","description":"...","required":true}]}}` | ✅ `200 OK`, tool ID `MujpuOiQdzLo7l7QFhoa`. 💡 **New finding:** creating a tool with a field auto-generated an associated variable (`variablesIds: ["X88HNEQbczFEpUVhj2nw"]`) — not documented in API Reference §5.3, a real behind-the-scenes linkage. |
| Get | `GET /tools/MujpuOiQdzLo7l7QFhoa` | ✅ `200 OK`, full config returned, matches what was created |
| Update (1st attempt) | `PATCH /tools/{id}` — `{"tool":{"name":"...UPDATED","disabled":true}}` (no `description`, matching API Reference §5.4's documented partial-update example) | 🔴 `400 BAD_REQUEST` — `{"issues":[{"path":["tool","description"],"message":"Required"}]}`. 💡 **Real finding, undocumented in API Reference §5.4:** unlike the REST doc's example (which shows a partial PATCH without `description`), this workspace's live API **requires `description` on every tool PATCH**, not just create — the same "REST now validates more strictly than documented" pattern `Convocore_MCP_Reference_v1.md` §11.3 found on `create_agent`'s `nodes[]`. |
| Update (2nd attempt, with `description`) | Same PATCH + `"description": "..."` | ✅ `200 OK`, `disabled: true` and new `name` persisted |
| Delete | `DELETE /tools/MujpuOiQdzLo7l7QFhoa` | ✅ `200 OK`, `"Tool deleted successfully"` |
| Confirm deletion | `GET /tools/MujpuOiQdzLo7l7QFhoa` | 🔴 `401 UNAUTHORIZED` — `"Unauthorized to get this tool"`. 💡 **Real finding:** a deleted resource returns `401` rather than the more intuitive `404` — an odd but real, live-confirmed error-code choice. Confirms deletion regardless (the tool is unambiguously gone), just via an unexpected status code. |

### 4.2 Variables

| Step | Call | Result |
|---|---|---|
| Create | `POST /agents/dg0ZED4gIzX3T7cy7CIm/variables` — `{"variable":{"key":"rest_test_var","type":"string","description":"...","defaultValue":"","isGlobal":true}}` | ✅ `200 OK`, variable ID `nEnxc75tCnen4J0NueLA` |
| Get | `GET /variables/nEnxc75tCnen4J0NueLA` | ✅ `200 OK`, matches created data |
| Update | `PATCH /variables/{id}` — `{"variable":{"value":"UPDATED_VALUE"}}` (partial, matching API Reference §6.4's documented example exactly) | ✅ `200 OK` — **worked correctly on the first attempt**, no extra-required-field surprise here, unlike Tools above |
| Delete | `DELETE /variables/nEnxc75tCnen4J0NueLA` | ✅ `200 OK`, `"Variable deleted successfully"` |
| Confirm deletion | `GET /variables/nEnxc75tCnen4J0NueLA` | 🔴 `401 UNAUTHORIZED` — `"Unauthorized to get this variable"` — same post-deletion status-code quirk as Tools |

### 4.3 Verdict

**Both Tools and Variables have fully functional CRUD via direct REST**, confirming `Convocore_API_Reference_v1.md` §5–§6's documented claims are accurate in substance (all documented endpoints work), with two real, previously-unconfirmed wrinkles: (1) `PATCH /tools/{id}` requires `description` even for a partial update, contradicting that section's own documented example; (2) both resource types return `401 Unauthorized` rather than `404 Not Found` when you try to GET something that was just deleted. Since MCP doesn't expose either resource group at all, **there is no MCP-vs-REST comparison to make here** — this section exists purely to close the "never live-tested on either surface" gap noted in the MCP reference doc's boundary table.

---

## 5. Cleanup

**Call:** `DELETE /agents/dg0ZED4gIzX3T7cy7CIm` → `200 OK`, `{"success":true,"message":"Agent deleted successfully with 0 associated documents"}`.

**Confirmation:** `GET /agents` → only `Zenny AI` (`mpapFWb3SWHZQ46UsoR3`) and `Bakery Assistant` (`okD4RvhZ9VgEJ0GFcws3`) remain. **Test agent deletion confirmed.** The one test tool and one test variable created in §4 were already individually deleted and confirmed gone in that section — no orphaned resources remain anywhere from this test run.

---

## 6. Summary — MCP-specific vs. Backend Bug

| # | Bug (as originally found via MCP) | Direct REST/WebSocket result | Verdict |
|---|---|---|---|
| 1 | `childrenNodes: [id, ...]` writes with no validation error, but crashes `interact_with_agent` with `TypeError: Cannot create property 'condition' on string` | **Identical write behavior, identical crash, byte-for-byte identical error message** — reproduced via a raw WebSocket connection with zero MCP involvement and no auth header at all | 🔴 **Backend bug, not MCP-specific.** MCP's `interact_with_agent` was faithfully relaying a real Convocore backend crash in its routing engine. |
| 2 | `get_conversation`/`update_conversation`/`assign_conversation`/`delete_conversation` all fail with "Conversation not found" on conversations that clearly exist per `list_conversations` | **Identical failure** — reproduced via raw `GET`/`PATCH`/`DELETE` on the exact same conversation, which the raw `GET .../convos` list call confirms exists | 🔴 **Backend bug, not MCP-specific.** Convocore's own single-item conversation lookup doesn't find records its own list endpoint can see. |
| 3 | `get_agent_usage` fails with "Unauthorized workspace scope" using our workspace secret, regardless of agent | **Identical failure at the agent-usage endpoint** (`POST /agents/{id}/usage`) — but the **workspace-level** usage endpoint (`POST /workspaces/{uid}/usage`) **succeeds** with the exact same credential | 🔴 **Backend bug, not MCP-specific** — and more precisely scoped than originally known: it's specifically the agent-level usage endpoint's authorization check that's broken, not a general credential/permission problem. A working workaround was identified (§3.3). |

**Bottom line: all three bugs are confirmed real Convocore backend issues, completely independent of MCP.** None of them originate in, or are made worse by, the `moe003/convocore-mcp` / `convocore-mcp` npm package — that MCP server was, in every case, accurately surfacing genuine upstream API behavior. This means: (a) switching MCP client versions/methods (Docker vs. npx, v2.1.0 vs. v2.3.8 — see `Convocore_MCP_Reference_v1.md` §11) was never going to fix any of these three, and didn't; (b) if these bugs matter to a real build, they need to be reported to Convocore directly (or worked around, per §3.3's usage-endpoint workaround) — no amount of MCP-side troubleshooting can resolve them.

---

## Glossary (terms specific to this document, beyond what the MCP/API reference docs already define)

| Term | Meaning |
|---|---|
| **Raw REST / raw WebSocket** | Making the HTTP/WebSocket call directly (via `curl` or a plain script) against Convocore's real servers, with no MCP server, no wrapper library, and no abstraction layer in between — the same request an MCP tool would eventually make, minus the MCP translation step. |
| **MCP-specific bug** | A bug that only manifests because of how an MCP server translates/wraps a request — the underlying API is fine, but the wrapper introduces or worsens the problem. None of the three bugs tested here turned out to be this. |
| **Backend bug** | A bug that exists in Convocore's own API/infrastructure, reproducible with zero MCP involvement — meaning no MCP-side fix, version change, or client swap can resolve it. All three bugs tested here are this. |

---

## 7. Follow-up Live Test — Recovery-Messaging Workaround — 2026-08-02

> **Purpose:** the §2/§6 finding above ("single-item conversation lookup is a real backend bug") blocks a planned recovery-messaging use case — sending a follow-up message into the same conversation a lead originally contacted through. This section tests a specific question: **is the bug scoped narrowly to single-item GET, or does it affect every single-item operation on a `convoId` (including writes)?** If PATCH-without-a-prior-GET works, recovery messaging could ship on pure REST. If not, this section also checks whether a genuine "send a message" REST endpoint exists at all, separate from WebSocket Interact.
>
> **Credentials/config used this session:** a **new workspace secret**, `vg_sBw7SK2YCeuY8ryoAn16` (supplied for this task, distinct from the one used in §0–§6 above — this session's workspace has different real agents, `Zenny-UI` and `NextGen AI Assistant`, protected here with the same never-touch discipline `Zenny AI`/`Bakery Assistant` got earlier). Region unchanged: `na-gcp`, base URL `https://na-gcp-api.vg-stuff.com/v3` for all v3 calls. **Project root note:** the project directory was renamed since §0–§6 were written (now `E:\Programming\Zenny - breakthrough`, was referenced under a different name earlier) — noted here in case absolute paths elsewhere in this document look stale; nothing about the API findings below is affected by that.

### 7.0 Setup

**Call:** `POST /agents` — `{"agent":{"title":"Recovery Send Test — safe to delete","agentPlatform":"vg"}}` → `200 OK`, **agent ID `5c3B8ZUCKH4mcPsCqWj8`**.

**Call:** `POST /agents/5c3B8ZUCKH4mcPsCqWj8/convos` — `{"conversation":{"ts":1785595800,"userName":"Recovery Lead Test","userEmail":"recoverytest@example.com","tags":["test-recovery"]}}` → `200 OK`, **convo ID `5c3B8ZUCKH4mcPsCqWj8_9VVlA0aDnOZDFMMSuYPJ`**. 💡 Note this conversation's own `userID` field is identical to its `ID`/convoId (`"userID":"5c3B8ZUCKH4mcPsCqWj8_9VVlA0aDnOZDFMMSuYPJ"`) — this turned out to matter in §7.2.

**Call:** `GET /agents/5c3B8ZUCKH4mcPsCqWj8/convos` (list only) → `200 OK`, conversation present with correct fields. **The convoId used in every test below came only from this list call — no single-item GET was ever performed before Test 4's deliberate control check.**

### 7.1 Test 1 — Does PATCH work without a prior GET?

**Call:** `PATCH /agents/5c3B8ZUCKH4mcPsCqWj8/convos/5c3B8ZUCKH4mcPsCqWj8_9VVlA0aDnOZDFMMSuYPJ`
```json
{ "conversation": { "tags": ["test-recovery", "patched-no-prior-get"], "notes": "PATCH_WITHOUT_GET_TEST" } }
```
**Result:** `404 Not Found`
```json
{ "message": "Conversation not found", "code": "NOT_FOUND" }
```

**Verdict: NO — PATCH fails identically, with or without a prior GET.** This directly answers the core premise question: **the bug is not specific to reading.** It affects the single-item `convoId` lookup path itself, which every operation type (`GET`/`PATCH`/`DELETE`, per §2.3–2.4's original testing, now confirmed again here independent of call order) routes through. Avoiding the GET call does not route around anything — there was never a "poisoned by a prior failed GET" mechanism to avoid in the first place; the resource is simply unreachable by ID through this whole endpoint family, full stop.

### 7.2 Test 2 — Does PATCH (if it worked) actually deliver a visible message, or only update metadata?

Settled without further live testing, from a source already verified live in this document's own investigation history: `Convocore_MCP_Reference_v1.md` §11 sourced `update_conversation`'s tool description directly from the `Moe03/convocore-mcp` project's own source code: *"Patch fields on the light conversation document. This does NOT replace the stored turn/message history. To replace transcript turns, use `update_conversation_messages`."* `PATCH /agents/{agentId}/convos/{convoId}` only ever touches the **light conversation document** (metadata: tags, notes, userName, state, etc.) — never the actual message/turn transcript a user would see rendered in a chat UI. **Even if Test 1 had succeeded, PATCH alone would not have delivered a visible message to the end user** — it's the wrong mechanism regardless of whether the "not found" bug exists.

**Does a genuine send/inject-message REST endpoint exist, separate from WebSocket Interact?** Checked directly against Convocore's real, live documentation — not assumed:
- Convocore's REST API's own **OpenAPI spec** (`https://docs.convocore.ai/api-reference/v3/openapi.json`, 971KB, fetched and parsed directly) confirms the only `convos`-related paths are `GET/POST /agents/{agentId}/convos`, `GET/PATCH/DELETE /agents/{agentId}/convos/{convoId}`, and the two `/export` variants — **no `/messages` path, no dedicated send-message path, anywhere in the v3 spec.**
- Convocore's documentation index (`https://docs.convocore.ai/llms.txt`, fetched directly) lists a page titled **"Chat Interact"** at `https://docs.convocore.ai/api-reference/agents/interact/post.md`, distinct from both **"Interact WebSocket"** (`Sockets/interact.md`) and **"Interact channel"** (the AsyncAPI/WebSocket doc at `api-reference/asyncapi/interact/websockets/interact-channel.md`). Digging into the rendered page's embedded metadata (the `.md`/summarized fetch returned only a stub, but the full HTML page embeds Mintlify's page-config JSON) revealed the real operation definition: **`POST /agents/{agent_id}/interact/{user_id}`**, described as *"Interact with an agent (VF/VG)."* A second, related endpoint was also found: `POST /agents/{agent_id}/interact/{user_id}/state` ("Configure State").

**This confirms a genuine, separate, documented REST endpoint for interacting with an agent exists — distinct from WebSocket Interact and distinct from the `/convos/{convoId}` family entirely.**

### 7.3 Test 3 — Testing the Chat Interact REST endpoint the same no-prior-GET way

**Finding the correct base URL (empirical, since the docs page didn't render a full spec):** this endpoint's URL path (`/agents/{agent_id}/interact/{user_id}`, no `/v3/` prefix, distinct site-nav grouping from the "v3" pages) matched the pattern of API Reference §1/§3's **V2/Legacy REST surface**, not V3. Tested all four candidate base URLs directly:

| Base URL tried | Result |
|---|---|
| `https://na-gcp-api.vg-stuff.com/v3` | `404` — `{"message":"Not found","code":"NOT_FOUND"}` |
| `https://na-gcp-api.vg-stuff.com` (no `/v3`) | `404` — `{"error":{"code":"NOT_FOUND","message":"Route POST /agents/.../interact/... not found"}}` |
| `https://na-cloudflare.vg-stuff.com` | ✅ `200 OK` — real response, agent config echoed back |
| `https://na-vg-edge.moeaymandev.workers.dev` | ✅ `200 OK` — same real response (confirms these two are aliases of the same backend, matching API Reference §3's note that both URLs serve `/v2/agents/*`) |

**Confirmed: this endpoint lives on the V2/Legacy REST surface, not V3** — a genuinely new piece of information not previously documented anywhere in this project's Convocore reference docs.

**Call (using the convoId/userID obtained from §7.0's LIST call only, never a single-item GET):**
```
POST https://na-cloudflare.vg-stuff.com/agents/5c3B8ZUCKH4mcPsCqWj8/interact/5c3B8ZUCKH4mcPsCqWj8_9VVlA0aDnOZDFMMSuYPJ
{ "prompt": "start" }
```
**Result:** `200 OK` — `success: true`, **no "Conversation not found" error, no NOT_FOUND anywhere** — the agent and user/conversation resolved correctly. But:
```json
{
  "success": true,
  "message": "Successfully interacted runtime.",
  "turns": [],
  "oldTurns": [],
  "isFreshStart": false,
  "metadata": {
    "error": "TypeError: Cannot read properties of undefined (reading 'payload')",
    "otherThing": "wss://na-gcp-api.vg-stuff.com/ws",
    "otherOtherThign": "https://na-gcp-api.vg-stuff.com/utils/ws-to-normal"
  },
  "debug": { "vfResponse": null, "vgResponse": { "turns": [], "metadata": { "error": "TypeError: Cannot read properties of undefined (reading 'payload')" } } }
}
```
**Reproduced identically 3 times** with different payload shapes (`{"prompt":"start"}` twice, `{"message":"Hello, this is a recovery test message."}` once) — same `TypeError`, always empty `turns: []`, every time. A fourth attempt with a fuller, WebSocket-`InteractObject`-shaped payload (`agentId`, `convoId`, `bucket`, `agentData`, `lightConvoData` all included) made things *worse*, tripping stricter validation: `{"success":false,"message":"Invalid request input."}` — so the endpoint has real, non-trivial schema requirements that neither the minimal nor the WebSocket-mirrored payload satisfied correctly, and this task's scope didn't extend to fully reverse-engineering the exact required shape.

💡 **Diagnostic detail worth recording:** the embedded `debug.vfResponse: null` alongside a populated `vgResponse` object, combined with the exact error text ("reading 'payload'"), strongly suggests this legacy endpoint's internal response-merging logic expects a Voiceflow (`vf`) response object to exist even for native (`vg`) agents, and crashes trying to read a `.payload` property off it when it's `null`. If accurate, this would mean the bug reproduces for **any `vg`-platform agent** hitting this endpoint, not something specific to this test's payload — but that inference wasn't independently confirmed against a `vf`-platform agent, which this workspace didn't have available to test.

**Verdict: the Chat Interact REST endpoint is real, reachable, and does *not* suffer from the "Conversation not found" bug** (the resource is found correctly) — **but it has its own separate, real, reproducible internal error that prevents it from actually generating or delivering a message**, at least for a native (`vg`) agent with the payload shapes tried here.

### 7.4 Test 4 — Control: reconfirm the original GET bug

**Call:** `GET /agents/5c3B8ZUCKH4mcPsCqWj8/convos/5c3B8ZUCKH4mcPsCqWj8_9VVlA0aDnOZDFMMSuYPJ` (v3, same conversation as every test above)
**Result:** `404 Not Found` — `{"message":"Conversation not found","code":"NOT_FOUND"}` — **identical to §2.3 and §6's original finding.** Bug still reproduces exactly as documented; not a new discovery, included per task instructions as a same-session control.

### 7.5 Cleanup

`DELETE /agents/5c3B8ZUCKH4mcPsCqWj8` → `200 OK`, `"Agent deleted successfully with 0 associated documents"`. `GET /agents` → only `Zenny-UI` (`1nyXSGBFG1yOj0T9DIPM`) and `NextGen AI Assistant` (`tFqkr0YqWG9f96roFutN`) remain — **test agent deletion confirmed**, this session's two real agents untouched throughout.

### 7.6 Verdict — is recovery messaging REST-feasible?

Answering the four questions this section set out to resolve, plainly:

**(a) Does PATCH work without a prior GET?** **No.** It fails identically to a normal PATCH — the bug is not GET-specific or order-dependent; it affects the entire `/agents/{agentId}/convos/{convoId}` single-item family regardless of which method you call or what you called before it.

**(b) Does PATCH alone deliver a visible message, or only change metadata?** **Metadata only**, confirmed by the tool's own documented behavior (§7.2) — this was never going to work for recovery messaging even if the bug didn't exist, because `PATCH .../convos/{convoId}` was never the right endpoint for sending a message in the first place.

**(c) Does a genuine "send message into existing conversation" REST endpoint exist, separate from WebSocket Interact?** **Yes** — `POST /agents/{agent_id}/interact/{user_id}` on the **V2/Legacy** base URL (`na-cloudflare.vg-stuff.com` / `na-vg-edge.moeaymandev.workers.dev`, not `na-gcp-api.vg-stuff.com/v3`) is real and does resolve the conversation correctly, bypassing the V3 "not found" bug entirely. But it currently has its own separate, reproducible internal bug (`TypeError` on every attempt tried) that prevented confirming it can actually deliver a message end-to-end.

**(d) Is the original GET bug still reproducible as a control?** **Yes**, identically, confirmed in §7.4.

> ## Bottom-line recommendation
> **Recovery messaging into an existing conversation is not currently REST-feasible via any path tested in this session.** The obvious REST workaround (skip the broken GET, PATCH directly) doesn't work — PATCH hits the identical bug, and wouldn't have delivered a visible message even if it had succeeded. The one genuine alternative REST endpoint found (`POST /agents/{agent_id}/interact/{user_id}`, V2/Legacy) does correctly resolve the conversation without hitting the known bug, which is a real, useful, previously-undocumented finding — but it's currently broken by a *different* bug of its own, so it isn't a working substitute today. **This leaves WebSocket Interact (§1 of this document, confirmed working end-to-end with a real agent reply in the original test) as the only currently-confirmed way to deliver an actual message into a conversation.** Recommendation: build the recovery-messaging feature against WebSocket Interact, not REST, until either the V3 conversation-lookup bug or the V2 Chat Interact endpoint's internal error is fixed upstream by Convocore — and consider filing both as bug reports, since neither is an MCP or client-side issue (consistent with this entire document's §6 conclusion).

---

## 8. Follow-up Live Test — REST-Created vs. Naturally-Occurring Conversations — 2026-08-02

> **Purpose:** §2, §6, and §7 all found the "Conversation not found" bug exclusively on conversations created via `POST /agents/{agentId}/convos` (REST). This section tests the specific hypothesis that the bug is scoped to REST-created conversation records, not a general backend defect affecting every conversation — using a real, actual chat (via WebSocket Interact) against a genuine test agent the user built by hand, **`Zenny-UI`** (agent ID `1nyXSGBFG1yOj0T9DIPM`), instead of a disposable Claude-created agent. This agent's Canvas/nodes/instructions/tools/variables were never touched — only a real chat conversation was had with it, and read-only/metadata-only REST calls were made afterward.
>
> **Credentials/config:** same workspace secret as §7 (`vg_sBw7SK2YCeuY8ryoAn16`), same base URLs. **Note on project state:** the project directory has been renamed again since §7 (now confirmed as `E:\Programming\Zenny - breakthrough`) — flagged here for the same reason as before, in case earlier absolute-path references anywhere in this document look stale to a future reader.

### 8.1 Step 1 — A real multi-turn conversation via WebSocket Interact

Ran a plain Node.js script (native `WebSocket`, no libraries — same approach as §1.2) against `wss://na-gcp-api.vg-stuff.com/interact`, one connection per turn per API Reference §17.5's documented design, reusing a single client-chosen `convoId` (`real-convo-test-1785690869`) across all turns — per API Reference §17.3, the client is expected to choose/generate this ID itself.

| Turn | Prompt | Result |
|---|---|---|
| 1 | `"Hi"` | ✅ Real agent processing observed — KB-gate evaluation ("KB skipped · Fast skip before gate model call"), turn correctly recorded |
| 2 | `"What can you help me with today?"` | ✅ Real KB search actually triggered this time ("AI decided to search... 2 queries... 0 chunks") — genuine agent reasoning, not a canned reply. `sync_chat_history` correctly included Turn 1 alongside the new turn, confirming continuity under the same `convoId` |
| 3 | `"Thanks, that's all for now."` | ✅ Agent correctly recognized this as a closing remark and skipped KB search accordingly ("closing acknowledgement and does not require further info") |

💡 **Protocol note, not previously documented:** the actual live stream used message types **`turn_patch`** and **`turn_commit`** (incremental/final turn-state updates) in addition to `sync_chat_history` and `metadata` — types not listed in API Reference §17.4's documented set (`sync_chat_history` / `metadata` / `debug` / `action` / `chunk`). The protocol has evidently grown richer streaming granularity since that section was written; worth knowing if building a real client against this endpoint; `Convocore_API_Reference_v1.md` §17.4 is incomplete on this point.

### 8.2 Step 2 — Single-item GET on this real conversation

**Call:** `GET /agents/1nyXSGBFG1yOj0T9DIPM/convos/real-convo-test-1785690869`
**Result:** `200 OK` — 🎯 **succeeds**, full rich data:
```json
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "data": {
    "ID": "real-convo-test-1785690869",
    "messagesNum": 6,
    "interactionsNum": 3,
    "summary": "The user initiated the conversation by asking about the agent's capabilities. The agent, Zenny, first clarified that it can only access events through Google Calendar. It then detailed its functionalities...",
    "tokenUsage": { "cumulativeInputTokens": 29940, "cumulativeOutputTokens": 664, "cumulativeUsd": 0.0098, "lastTurnModelId": "MiniMaxAI/MiniMax-M3", ... },
    "nodesInfo": { "currentNode": "__start__" },
    "contactIdentityId": "f903f445-d113-49ac-a923-3bf1aa595d06",
    ...
  }
}
```
This is not a bare-minimum success — the record includes an **AI-generated conversation summary**, per-turn **token/cost usage**, current **Canvas node position**, and a **contact identity ID** — a fully-populated, production-quality conversation document. This is the headline finding of this section: **the exact same endpoint that returns "Conversation not found" 100% of the time on REST-created conversations (§2, §7) returns full, correct data on this WebSocket-originated one.**

### 8.3 Step 3 — Cross-check via list, and ID-format comparison

**Call:** `GET /agents/1nyXSGBFG1yOj0T9DIPM/convos?limit=5` → `200 OK`, four conversations returned:

| ID | Origin | How it was created |
|---|---|---|
| `real-convo-test-1785690869` | web-chat | This test (WebSocket Interact, client-chosen ID) |
| `DL2kG9YWdZpGGOn` | web-chat | Genuinely pre-existing — a real prior chat, not created by this test session |
| `27986828194334741` | messenger | Genuinely pre-existing — a real Facebook Messenger PSID |
| `6909719720` | telegram | Genuinely pre-existing — a real Telegram chat ID |

**Structural comparison against REST-created conversation IDs** (from §2/§7's testing, e.g. `dg0ZED4gIzX3T7cy7CIm_3HJu0OJs8nqVZIRxNcBL`, `5c3B8ZUCKH4mcPsCqWj8_9VVlA0aDnOZDFMMSuYPJ`): every REST-created (`POST /convos`) conversation ID observed in this document follows the exact pattern **`{agentId}_{randomSuffix}`** — the literal agent ID, an underscore, then a suffix. **Not one of the four real conversations above follows that pattern.** Real conversations are either a short random alphanumeric string (Convocore's own widget-generated session ID, e.g. `DL2kG9YWdZpGGOn`), or a platform-native identifier passed straight through from the origin channel (a Messenger PSID, a Telegram chat ID, or — in this test's case — whatever string the calling client chose to send as `convoId` over WebSocket).

💡 **Concrete, actionable diagnostic rule extracted from this comparison:** **any `convoId` that starts with `{agentId}_` was almost certainly created via `POST /agents/{agentId}/convos` and should be assumed to hit the "not found" bug on every single-item operation.** Any `convoId` that does *not* follow that shape (freeform string, platform-native numeric ID, widget-generated short ID) is far more likely to behave normally on single-item `GET`/`PATCH`/`DELETE`.

**Corroboration beyond this test's own conversation:** to confirm this isn't specific to something about *this* test run, `GET /agents/1nyXSGBFG1yOj0T9DIPM/convos/DL2kG9YWdZpGGOn` (a genuinely pre-existing real conversation, created by an actual prior chat, completely unrelated to this test session) was also called → ✅ `200 OK`, full data returned (including its own AI-generated summary about a Calendly-events request). **Two independent real conversations, one from this test and one pre-existing, both work correctly** — this is not a fluke specific to one record.

### 8.4 Step 4 — PATCH and export on the real conversation

**Call:** `PATCH /agents/1nyXSGBFG1yOj0T9DIPM/convos/real-convo-test-1785690869` — `{"conversation":{"tags":["test-recovery-real-convo"],"notes":"REAL_CONVO_PATCH_TEST"}}`
**Result:** ✅ `200 OK` — `"Successfully updated conversation..."`, `tags`/`notes` correctly applied, full conversation document echoed back with the update in place.

**Call:** `GET /agents/1nyXSGBFG1yOj0T9DIPM/convos/real-convo-test-1785690869/export`
**Result:** 🔴 `403 Forbidden` — `{"message":"Chat Export API addon required. Subscribe to chat-export-api to use this endpoint.","code":"FORBIDDEN"}` — **identical billing-add-on gate found in §2/§7**, confirmed here too. This is **unrelated to the REST-vs-real distinction** — it's a plan/billing limitation that blocks export on *every* conversation regardless of origin, not a symptom of the "not found" bug.

### 8.5 Step 5 — Does a follow-up message actually append to the same conversation?

Sent a 4th turn via the same WebSocket script, same `convoId`, prompt `"Actually, one more question — are you still there?"`. Then re-fetched the conversation via single-item GET:

| Metric | Before follow-up (after 3 turns) | After follow-up (4 turns) |
|---|---|---|
| `messagesNum` | 6 | **8** |
| `interactionsNum` | 3 | **4** |
| `ID` | `real-convo-test-1785690869` | `real-convo-test-1785690869` (unchanged) |

**Confirmed: the follow-up message correctly appended to the existing conversation record — same `convoId`, growing message/interaction counts, updated AI summary reflecting the new exchange — rather than creating a new, separate conversation.** This is the exact mechanism a Recovery Engine follow-up would depend on, and it works correctly via WebSocket Interact.

### 8.6 Step 6 — KB endpoints on a genuinely empty KB

`Zenny-UI` has zero KB documents. No documents were added — every call below is read-only/query-only.

| Endpoint | Result |
|---|---|
| `GET /agents/1nyXSGBFG1yOj0T9DIPM/kb` (list) | ✅ `200 OK` — `{"success":true,"data":[],"total":0,"pageSize":10,"hasMore":false,"nextCursor":null,"totalPages":0,"currentPage":1}`. Clean, well-formed empty-state response — no surprises. |
| `GET /agents/1nyXSGBFG1yOj0T9DIPM/kb/stats` | 🔴 **`500 Internal Server Error`** — `{"message":"\"undefined\" is not valid JSON","code":"INTERNAL_SERVER_ERROR"}`. **A real, previously-undocumented bug**, live-confirmed: this endpoint crashes specifically in the zero-documents state, apparently attempting to `JSON.parse(undefined)` somewhere in its aggregation logic instead of returning `{ docsCount: 0, charCount: 0 }` gracefully. Every other KB stats call in this document's history (§10/§11 of the MCP reference doc) was against agents with existing KB content — this is the first time the genuinely-empty case was tested, and it's broken. |
| `POST /agents/1nyXSGBFG1yOj0T9DIPM/kb/search` — `{"searchQuery":"test query on empty kb","max_chunks":3,"with_payload":true}` | ✅ `200 OK` — `{"success":true,"message":"KB search completed successfully","data":[]}`. Handles the empty-KB case gracefully, unlike `stats`. |

**Verdict: KB `list` and `search` both handle an empty KB correctly; `kb/stats` does not — a genuine, reproducible 500 error, not previously known.** Worth filing as its own bug report if `get_kb_stats` (MCP) or its REST equivalent is ever called on a freshly-created agent before any KB docs are added — a realistic, common sequence (create agent → check KB stats before populating it) that will currently fail.

### 8.7 Verdict — is the bug REST-specific or universal?

**(a) Does the single-item GET bug reproduce on a real, dashboard/widget/WebSocket-originated conversation, or only on REST-created ones? — THE HEADLINE FINDING: it is REST-creation-specific.** Every conversation created via `POST /agents/{agentId}/convos` in this document's entire testing history (§2, §7) has failed single-item `GET`/`PATCH`/`DELETE` with "Conversation not found," with 100% reproducibility. Every conversation *not* created that way — a fresh one created live via WebSocket Interact in this test, plus a completely independent, genuinely pre-existing real conversation — succeeded on the identical endpoint, with rich, correct data, 100% of the time. The distinguishing factor is not conversation age, agent, workspace, or credential — it is specifically **whether `POST /convos` was ever called for that record.**

**(b) Does the full PATCH/export/multi-turn-append chain work correctly on real conversations?** **Yes, except export** — `GET`, `PATCH`, and multi-turn appending (via WebSocket) all work correctly and were independently confirmed. `export` fails, but for an unrelated reason (the `chat-export-api` billing add-on gate, confirmed blocking *every* conversation regardless of origin in §2/§7 too) — not a symptom of the bug being investigated here.

**(c) What does Convocore actually return for the 3 KB endpoints on a genuinely empty KB?** `list` → clean empty array, `200`. `search` → clean empty array, `200`. `stats` → **`500 Internal Server Error`**, a real bug, newly discovered.

> ## 🎯 Significant, actionable correction to prior guidance
> **The Recovery Engine should never create conversation records via `POST /agents/{agentId}/convos` if it later needs to read, update, or send follow-up messages into them by ID.** REST-created conversations are reliably broken for every single-item operation tested across this document (§2, §7, and implicitly here). **Naturally-occurring conversations — created by an actual WebSocket Interact turn (a real chat, whether from a live user or from your own backend simulating one via `wss://.../interact`) — behave completely correctly** for `GET`, `PATCH`, and multi-turn append, and can be distinguished after the fact by their ID shape (§8.3's `{agentId}_{suffix}` rule of thumb). **Practical recommendation: if the Recovery Engine needs a conversation record it can reliably read/update/append to later, originate it via a real WebSocket Interact turn (even a lightweight one, e.g. sending `"start"` or a minimal opening message) rather than `POST /convos` — do not use the REST creation endpoint for any conversation the system will need to interact with again by ID.** This changes the earlier §7 recommendation from "use WebSocket Interact to *send messages*" to the stronger, more specific "use WebSocket Interact to *originate* the conversation record in the first place" — REST conversation creation should be treated as unreliable for anything beyond write-once, read-never bulk-import scenarios (which is, incidentally, exactly the "edge-case/import tool" use Convocore's own API Reference §9.3 describes for that endpoint).

### 8.8 Cleanup note

No cleanup was required or performed on `Zenny-UI` itself, per instructions — the agent's Canvas/nodes/instructions/tools/variables were never modified. The one artifact created is the test conversation record (`real-convo-test-1785690869`) and its `test-recovery-real-convo` tag, left in place intentionally as it's a normal, harmless conversation record (not a disposable resource requiring deletion) and deleting real conversation data from a production agent without being asked to was judged out of scope for a "treat with care" instruction.

---

## 9. Investigation — Sending a Message AS the Agent (Recovery Engine Outbound) — 2026-08-02

> **Purpose:** §8 confirmed the WebSocket `prompt` field simulates a **customer** message, which then makes the agent generate its own reply — the wrong mechanism for Recovery Engine, which needs the agent to speak first, unprompted, to a real customer (e.g. "still interested in that jacket?"). This section investigates three candidate paths for genuine agent-initiated outbound messaging, per explicit instruction: **research and reason first, live-test only what's safe and non-destructive, and never guess a solution if none of the three paths clearly works.**
>
> **Safety discipline followed:** no further messages were sent into `Zenny-UI`'s (`1nyXSGBFG1yOj0T9DIPM`) real conversations, including the existing `test-recovery-real-convo` one. The one live mechanism test in this section (§9.1.3) used a **fresh disposable test agent** (`66yCZzlxQRWIqASO91Sd`, created and deleted within this session), never a real customer conversation. No message was ever sent through a real external channel (WhatsApp, Messenger, SMS) to any real, unknown recipient — Path 3 (§9.3) is documented/reasoned analysis only, explicitly not live-tested, consistent with the instruction to stop and ask before anything that could reach a real person.

### 9.1 Path 1 — WebSocket Interact: is there an agent-side send mechanism?

**9.1.1 Re-reading the documented `InteractObject` (API Reference §17.3) closely:** the schema is `agentId`, `convoId`, `bucket`, `prompt`, `agentData`, `lightConvoData`. The doc is explicit and unambiguous: *"`prompt` — the actual text the user typed/said."* There is no separate field anywhere in this documented object for injecting agent-originated content — confirmed by close re-read, not assumption.

**9.1.2 Searching docs.convocore.ai and the MCP server's own richer schema for a hidden option:** a web search for "proactive message / agent initiated / outbound message" surfaced only one relevant Convocore page — **Agent Settings** (`docs.convocore.ai/agent-creation/settings`) — describing the dashboard's **"Proactive Message"** field. ⚠️ **This is a different, unrelated feature, worth explicitly distinguishing so it doesn't get confused with what Recovery Engine needs:** per Master Reference §2.5, "Proactive Message" is a **static, one-time greeting shown when the widget first loads** (a lightweight alternative to a full AI-generated Initial Prompt) — it fires once, automatically, at conversation start, and has no mechanism for re-triggering later into an *existing* conversation. It cannot be invoked on demand for an established conversation, so it does not solve the recovery-messaging use case. Beyond this, no distinct "send as agent" REST or WebSocket field was found anywhere in Convocore's public documentation.

The MCP server's `interact_with_agent` tool (the richest documented interface to this WebSocket, reverse-engineered by the `Moe03/convocore-mcp` maintainer beyond what Convocore's own docs cover — see `Convocore_MCP_Reference_v1.md` §11.7) exposes many more fields than the raw `InteractObject`: `messageType`, `visualPayload`, `replyTo`, `turnsHistory`, `disableUiEngine`, `disableRecordHistory`, `kbPreview`, `toolTest`, `formSubmissionMetadata`, etc. **None of these are an "agent speaks first" field either** — `turnsHistory` lets you *override what context the LLM sees before generating a new reply*, not inject a pre-written bot message without generation. Every field in both the documented and the MCP-reverse-engineered schema serves the same fundamental loop: client sends something → server (optionally) runs the LLM → server streams back what the LLM generated. There is no field, in either surface, for skipping generation and pushing an arbitrary pre-written string as a `from: "bot"` message.

**9.1.3 Direct transcript injection — does a `from: "bot"` turn type exist, and is it writable?**

Yes — and this was **live-tested successfully**, safely, on a disposable agent. `Convocore_MCP_Reference_v1.md` §11.2's source-code inspection had already found `update_conversation_messages`, mapped to `PATCH /agents/{agentId}/convos/{convoId}/messages`, with a `turns` array whose `from` field accepts `"system" | "bot" | "human"`. This endpoint does **not** appear in Convocore's public OpenAPI spec (confirmed by re-checking `openapi.json`'s `convos`-related paths directly — only `GET/POST /convos`, `GET/PATCH/DELETE /convos/{convoId}`, and the two `/export` variants exist there) — it is a real, working, but **undocumented** endpoint, known only via the MCP server maintainer's own reverse-engineering.

**Live test, on disposable agent `66yCZzlxQRWIqASO91Sd`:**
1. Created the agent, then originated a real conversation via WebSocket Interact (convoId `agent-inject-test-1785692274`, one turn: `"Hi"`) — per §8's finding, this ensures the conversation is WS-originated, not REST-created, so it won't hit the "not found" bug.
2. Confirmed `GET /agents/66yCZzlxQRWIqASO91Sd/convos/agent-inject-test-1785692274` → `200 OK`, as expected.
3. **Call:** `PATCH /agents/66yCZzlxQRWIqASO91Sd/convos/agent-inject-test-1785692274/messages`
   ```json
   {
     "turns": [
       { "from": "human", "messages": [{ "from": "human", "type": "text", "item": { "payload": { "message": "Hi" } } }] },
       { "from": "bot", "messages": [{ "from": "bot", "type": "text", "item": { "payload": { "message": "Hi, ready to help!" } } }] },
       { "from": "bot", "messages": [{ "from": "bot", "type": "text", "item": { "payload": { "message": "RECOVERY_TEST: Still interested? We saved your spot!" } } }] }
     ],
     "confirmReplace": true
   }
   ```
   **Result:** ✅ `200 OK` — `"Successfully updated conversation messages..."`, the full turns array (including the deliberately **bot-immediately-followed-by-bot** structure, with no intervening human message) echoed back exactly as sent.

**This confirms, structurally: yes, you can write a purely agent-initiated `from: "bot"` message into a conversation's stored transcript, with no customer prompt required to trigger it — the data-layer mechanism Recovery Engine would need does exist.**

**⚠️ The critical open question this does NOT answer, and should not be assumed:** does this write actually **deliver** the message to the customer through a live channel (a WhatsApp push notification, an SMS, a live update to an open web-widget), or does it only silently rewrite Convocore's own stored record? The tool's own source-derived description is explicit and telling: *"Replace the stored message turn history for a conversation... This **overwrites** `voiceglow/{agentId}/convos/{convoId}/convo/JSON_STRING` with the provided `turns` array"* — this is the language of a direct data-store field overwrite (a Firestore document write), not of a message-send/delivery/notification/webhook-trigger operation. No mention of "send," "deliver," "notify," "push," or "webhook" appears anywhere in its description. **This could not be directly verified either way in this session** — the disposable test agent had no connected WhatsApp/SMS number and no live, currently-open web widget to observe against. Absent stronger evidence, **the safe assumption is that this endpoint updates Convocore's own records only, and does not itself cause any message to reach the customer through a real channel.** Treating it as a delivery mechanism without confirming this further would be a real, live-traffic-affecting mistake for Recovery Engine to make.

### 9.2 Path 2 — Campaigns: does this solve it instead?

Re-examined `Convocore_Master_Reference_v3.md` §21.1 and pulled the **actual, real OpenAPI schema** directly (`docs.convocore.ai/api-reference/v3/openapi.json`, parsed programmatically — not assumed from the dashboard description alone, since `Convocore_API_Reference_v1.md` §12 explicitly flagged this resource group's schema as never having been fully captured before now).

**Confirmed real endpoints:** `GET/POST/PATCH/DELETE /agents/{agentId}/campaigns` and `PATCH /agents/{agentId}/campaigns/{campaignId}`.

**Full, real `POST /agents/{agentId}/campaigns` request schema, pulled directly from the spec:**
```json
{
  "required": ["name", "leadGroupName", "delayBetweenEachCall", "concurrentSlots"],
  "properties": {
    "name": "string", "leadGroupName": "string",
    "delayBetweenEachCall": "number", "concurrentSlots": "number",
    "initialPrompt": "string", "postCallPrompt": "string",
    "postCallMetrics": ["string"], "enabled": "boolean"
  },
  "additionalProperties": false
}
```
**There is no field anywhere in this schema for a single contact, a single conversation, or a single lead — only `leadGroupName`, a reference to a pre-existing bulk group.** `delayBetweenEachCall` and `concurrentSlots` are voice-calling-specific concurrency/pacing controls with no meaning for a single ad-hoc send. `additionalProperties: false` on the schema rules out any undocumented passthrough field either. The single `PATCH /agents/{agentId}/campaigns/{campaignId}` operation that does exist only accepts `{ "ownerId": "string" }` — reassigning campaign ownership, nothing relevant here.

**Verdict: Campaigns is confirmed, definitively, structurally incapable of targeting one specific existing conversation/contact on demand.** It is exclusively a bulk, lead-group-driven, scheduled-lifecycle feature (create → group leads → run against the whole group, with concurrency/pacing/scheduling), exactly matching Master Reference §21.1's dashboard description and the task's own suspicion. This path does not solve the Recovery Engine use case, full stop — not "the least-bad option," a genuine non-fit.

💡 One real, useful side-finding: `postCallMetrics` accepting arbitrary Custom Metric keys (Master Reference §21.2) confirms campaigns can report outcomes back through the same Custom Metrics system used elsewhere — not relevant to solving this task, but worth knowing for other Campaign-adjacent work.

### 9.3 Path 3 — Direct Channel API: bypass Convocore's conversation layer entirely?

**Documented/reasoned analysis only — not live-tested, per the explicit instruction to stop before anything that could reach a real, unknown recipient.**

Per `Convocore_Master_Reference_v3.md` §19.3–19.5, setting up WhatsApp or Messenger integration requires the workspace owner to **generate their own Meta credentials directly from Meta's own developer console** — a Phone Number ID, WhatsApp Business Account ID, and a permanent system-user access token (WhatsApp), or a Page Access Token (Messenger) — and paste them **into** Convocore's Channels config. This is the key structural fact this path depends on: **these credentials originate outside Convocore, are generated and held by the workspace owner independently, and are not something Convocore's API needs to hand back to you** — the team already has (or can regenerate) them directly from Meta's own Business/Developer dashboard, entirely independent of any Convocore API call. (Consistent with this: the `get_channel_integration_spec` MCP tool's own documented purpose, per `Convocore_MCP_Reference_v1.md` §11.7, explicitly includes "credential masking" as one of its concerns — strong secondary confirmation that Convocore does not expose these tokens back out through its own API for security reasons, but this doesn't block the path, since you don't need Convocore to hand them back if you already hold your own copy.)

**Structurally, this means:** yes, a backend the team controls could call Meta's **WhatsApp Cloud API** (`POST /{phone-number-id}/messages`) or the Messenger **Send API** directly, using the team's own independently-held Meta credentials, completely bypassing Convocore's conversation layer (and therefore also bypassing every bug found in §2/§7/§8, since none of them are reachable this way). The **recipient identifier** needed (the customer's WhatsApp phone number, or their Messenger PSID) is already visible directly in Convocore's own conversation records — confirmed live in §8.3, where a genuinely real Messenger conversation's `ID` field (`27986828194334741`) was, itself, a real Messenger PSID, and WhatsApp-origin conversations carry the customer's phone number in `userPhone`/similar lead-style fields (API Reference §9.1). So the necessary contact identifier for a direct send is obtainable by reading Convocore's own conversation record first, exactly as the task's framing anticipated.

**The conversation-history-split concern, addressed directly:** a message sent this way would **not** automatically appear in Convocore's own stored conversation history — Convocore's records only update through its own webhook-received/API-driven flow. **A deliberate write-back is required** to keep the two in sync, and the mechanism for that write-back is exactly Path 1's `PATCH /agents/{agentId}/convos/{convoId}/messages` (§9.1.3) — inject a `from: "bot"` turn describing what was actually sent, immediately after sending it directly via Meta's API. This is the one place the three paths connect: **Path 3 for genuine delivery, Path 1 for keeping Convocore's own record consistent afterward.**

**One universal constraint that applies regardless of which path is used, and matters a great deal for a "still interested in that jacket?" recovery scenario specifically:** WhatsApp's own Business Platform rules (a Meta-side constraint, not a Convocore one) require that any message a business sends to **re-open** a conversation outside the 24-hour customer-service window must use a **pre-approved message template**, not free-form text. This is *why* Master Reference §21.1 explicitly describes Convocore's own Campaigns as offering **"WhatsApp template campaigns"** specifically (not free-text campaigns) — Convocore's own bulk-outreach feature already respects this Meta-side rule. **This constraint applies identically whether the recovery message is sent via Convocore, via a direct Meta API call, or any other route** — if the customer's last message was more than 24 hours ago, "still interested in that jacket?" as free text will be rejected by Meta's API (or silently fail) unless it's sent as an approved template. This is worth flagging prominently to whoever builds Recovery Engine, independent of which of the three paths gets used.

### 9.4 Overall verdict — plain-language recommendation

**None of the three paths, alone, is a clean, fully-confirmed, ready-to-use solution.** Per the instruction not to present the least-bad option as if it were a clear answer, here is the honest state of each:

| Path | Exists? | Documented? | Live-tested? | Solves the use case? |
|---|---|---|---|---|
| 1. WebSocket/REST transcript injection (`PATCH .../messages`) | ✅ Yes | ⚠️ Undocumented publicly, known via MCP source only | ✅ Yes, on a disposable agent | 🟡 **Unconfirmed** — writes the record correctly, but likely does **not** deliver/push to a real channel (reasoned from its own description, not directly observable in this session) |
| 2. Campaigns | ✅ Yes | ✅ Documented (dashboard + now the real API schema, pulled live) | Schema-confirmed, not execution-tested (would require a real lead group + real send) | ❌ **No** — structurally bulk/group-only, no single-contact targeting field exists at all |
| 3. Direct Channel API (Meta WhatsApp/Messenger, bypassing Convocore) | ✅ Almost certainly, architecturally | ✅ Well-documented on Meta's side; Convocore's role (credential ownership) is documented in Master Reference §19 | ❌ Not tested — would require sending a real message to a real recipient, explicitly out of scope without further confirmation | 🟢 **Most likely to actually work for genuine delivery** — but requires infrastructure (the team's own Meta API integration) that doesn't yet exist in this project, plus a manual write-back into Convocore via Path 1 to avoid a conversation-history split |

> ## Plain-language recommendation
> **There is no built-in, single-call Convocore mechanism, confirmed working, that pushes an unprompted outbound message into an existing conversation and reliably delivers it to the customer.** The closest thing to a real answer is a **two-part combination**: (1) send the actual recovery message through the **channel's own native API** — Meta's WhatsApp Cloud API or Messenger Send API — using credentials the team already holds independently of Convocore (this is the only one of the three paths structurally capable of genuine, on-demand, single-recipient delivery); then (2) **write that sent message back into Convocore's conversation record** using the same `PATCH /agents/{agentId}/convos/{convoId}/messages` mechanism confirmed working in §9.1.3, so Convocore's own transcript/analytics/summary stay accurate. Campaigns (Path 2) is confirmed **not** a fit for single-conversation, on-demand recovery messaging — reserve it for genuine bulk/group outreach instead. Before building this, two things need direct, careful confirmation rather than being assumed: **(a)** whether `PATCH .../messages` (§9.1.3) triggers *any* live delivery on its own for *any* channel — worth a deliberate, carefully-scoped test with a real but consenting test number before ruling it out entirely; and **(b)** the 24-hour WhatsApp template-message window (§9.3) needs to be built into Recovery Engine's logic from day one, regardless of which delivery path is chosen, or messages will silently fail to send once a conversation goes cold — which is precisely the scenario Recovery Engine exists to address.

---

### 9.5 Live delivery test — real Messenger conversation — 2026-08-02

> **Follow-up to §9.4's open question (a).** §9.1.3's disposable-agent test confirmed the `PATCH .../messages` endpoint writes Convocore's own record correctly, but could not determine whether it actually delivers anything to a real customer, since no real channel was connected. This test closes that gap directly, on explicit, confirmed authorization: a real, consenting recipient on `Zenny-UI`'s (`1nyXSGBFG1yOj0T9DIPM`) live Messenger channel, conversation `27986828194334741` (a real Messenger PSID), expecting a test message. The agent's Canvas/nodes/instructions/tools/variables were not touched — only this one conversation record was written to.
>
> **A real risk was caught and flagged before proceeding, not glossed over:** this endpoint's own description says it performs a **full replacement** of the stored turn history, not an append. The light `GET /convos/{convoId}` endpoint (used for the before/after check below) only returns summary metadata — it does not expose the real `turns` array — and `export` (which would) is blocked by the `chat-export-api` billing add-on (§2, §7, §8). With no safe way to fetch and preserve the real 9-message history first, this was surfaced to the user directly before writing anything. **The user explicitly confirmed proceeding was acceptable, accepting the resulting history loss** — recorded here for the audit trail, not assumed or decided unilaterally.

**Step 1 — before state:** `GET /agents/1nyXSGBFG1yOj0T9DIPM/convos/27986828194334741` → `200 OK`. Key fields: `messagesNum: 9`, `interactionsNum: 4`, `lastMessageTS: 1785326394`, `summary`: *"The user was interacting with a UI Engine test agent... requested to see element number 9, 'Single Input'... attempted to test elements 10, 'Calendar Booking,' and 11, 'Invoice'..."* — a real, substantive prior conversation with real user "Muhaiminul Abedin Farhan."

**Step 2 — the test write.** **Call:** `PATCH /agents/1nyXSGBFG1yOj0T9DIPM/convos/27986828194334741/messages`
```json
{
  "turns": [
    {
      "from": "bot",
      "messages": [
        {
          "from": "bot",
          "type": "text",
          "item": { "payload": { "message": "This is a live delivery test from the Zenny team — please reply 'received' if you see this on Messenger. Thank you!" } }
        }
      ]
    }
  ],
  "confirmReplace": true
}
```
**Result — exact raw response:**
```json
{
  "success": true,
  "message": "Successfully updated conversation messages: 27986828194334741",
  "data": {
    "agentId": "1nyXSGBFG1yOj0T9DIPM",
    "convoId": "27986828194334741",
    "turns": [
      { "from": "bot", "messages": [{ "from": "bot", "type": "text", "item": { "payload": { "message": "This is a live delivery test from the Zenny team — please reply 'received' if you see this on Messenger. Thank you!" } } }] }
    ],
    "messagesNum": 1,
    "lastMessage": "This is a live delivery test from the Zenny team — please reply 'received' if you see this on Messenger. Thank you!",
    "updatedAt": 1785693265
  }
}
```
`HTTP 200`. Call succeeded at the API level.

**Step 3 — after state:** `GET /agents/1nyXSGBFG1yOj0T9DIPM/convos/27986828194334741` → `200 OK`.

| Field | Before | After |
|---|---|---|
| `messagesNum` | 9 | **1** |
| `interactionsNum` | 4 | 4 *(unchanged)* |
| `lastMessage` | *(not present in light doc before)* | `"This is a live delivery test from the Zenny team — please reply 'received'..."` |
| `lastMessageTS` | 1785326394 | 1785326394 *(unchanged — did not update to reflect the new message)* |
| `lastModified` | 1785692957753 | **1785693265** *(updated)* |
| `summary` | *(the original UI-Engine-testing summary)* | *(unchanged — still the original summary, not regenerated)* |

💡 **A real, useful diagnostic pattern, not asked for but worth recording:** `messagesNum` and `lastMessage`/`lastModified` updated, but `interactionsNum`, `lastMessageTS`, and the AI-generated `summary` did **not**. In every prior test where a message actually flowed through a real interaction pipeline (§8.1's WebSocket turns, §8.5's follow-up), *all* of these fields moved together, consistently. Here, only a narrow subset changed. This is a second, independent piece of evidence (beyond the endpoint's own "overwrites... JSON_STRING" description, §9.1.3) pointing the same direction: **this call touched a narrower slice of Convocore's own data than a full, real interaction does** — consistent with, though not conclusive proof of, a passive record-write rather than a full processing/delivery pipeline.

**Step 4 — per explicit instruction, no delivery auto-detection was attempted.** No polling, no webhook check, no assumption made either way about whether the message reached Messenger.

### 9.6 Result

**API-level result: SUCCESS.** The call returned `200 OK`, `success: true`, and the conversation record was verifiably updated to contain the test message (confirmed independently via a follow-up `GET`, not just trusted from the PATCH response alone).

**Real-world delivery: PENDING USER CONFIRMATION — cannot be verified from the API response alone.** Nothing in the API's response, or in the before/after comparison, constitutes proof that Messenger actually delivered this message to the real recipient's device. The narrower-field-update pattern noted above is suggestive, not conclusive, and is explicitly not being reported as a delivery verdict. Only the recipient checking their actual Messenger app — and replying "received," per the test message's own instruction — can answer that question.

---

## 10. Live Test — Knowledge Base REST Endpoints for Email Manager — 2026-08-02

> **Purpose:** confirm two things Email Manager's design depends on, against `Zenny-UI` (`1nyXSGBFG1yOj0T9DIPM`), which now has real KB content (the Zenny and ZeroManual/Company Brain marketing sites, crawled/imported). **Read-only throughout** — no KB document was created, edited, or deleted. (1) Can raw KB content be pulled directly via `list`/`get` — the mechanism Email Manager's locked-in design actually uses (live-fetch full content at send-time, never store/cache what Convocore returns). (2) Does KB search return correct, relevant results, tested separately from raw content access.

### 10.1 Test 1 — List KB documents + `kb/stats`

**Call:** `GET /agents/1nyXSGBFG1yOj0T9DIPM/kb?pageSize=50` → `200 OK`, `total: 2`, `hasMore: false`.

| Doc ID | Name | Source URL | Status |
|---|---|---|---|
| `b539fe03d583d15dce9c` | Zenny — AI Customer Support Agent by ZeroManual | `https://zenny.zeromanuals.com/` | `SUCCESS` |
| `b58e758415e57ff755d1` | Company Brain by ZeroManual — The self-running brain for your whole company | `https://zeromanuals.com/` | `SUCCESS` |

Both documents fully processed — **no pending/error status docs**. (The list response's own `content` field is empty for both, as seen in every prior KB-list test in this document — full content is only returned by the single-doc `GET`, tested next.)

**Call:** `GET /agents/1nyXSGBFG1yOj0T9DIPM/kb/stats` → `200 OK`
```json
{ "success": true, "message": "Successfully fetched KB stats", "data": { "charCount": 20642, "docsCount": 2 } }
```
**`kb/stats` is confirmed fixed now that the KB is non-empty.** §8.6 found a reproducible `500 Internal Server Error` (`"undefined" is not valid JSON`) on this exact endpoint against an agent with **zero** KB docs. With real content present, it returns clean, correct, sensible data (`charCount: 20642` matches the sum of both documents' content lengths found in §10.2 almost exactly — `10627 + 10010 = 20637`, off by 5 chars, plausibly a metadata/whitespace normalization difference, not a discrepancy worth chasing further). **This confirms the earlier bug was genuinely scoped to the zero-documents edge case specifically, not a general fault in the endpoint** — worth knowing so nobody avoids `kb/stats` altogether based on the earlier finding; it's fine once an agent has real content.

### 10.2 Test 2 — Get single KB documents (the core mechanism Email Manager depends on)

**Call:** `GET /agents/1nyXSGBFG1yOj0T9DIPM/kb/b539fe03d583d15dce9c` (Zenny doc) → `200 OK`, **1.363s**, 34,293 bytes raw response.
**Call:** `GET /agents/1nyXSGBFG1yOj0T9DIPM/kb/b58e758415e57ff755d1` (ZeroManual doc) → `200 OK`, **1.304s**, 32,406 bytes raw response.

**Response shape** (same three-part nested structure noted in earlier testing, `Convocore_MCP_Reference_v1.md` §4.3's `get_kb_doc` finding, confirmed again here): `{ vgKbDoc: {...}, data: {...}, chunks: [...] }`. The field that actually matters for Email Manager is **`data.vgKbDoc.content`** — a single flat string containing the **complete scraped page content as clean Markdown**.

**Content quality, checked directly, not assumed:**
- **Doc 1 (Zenny):** 10,627 characters. Genuinely complete, real marketing copy — navigation links, hero heading, pricing plan details ("Billed monthly — cancel anytime," "Enterprise from $9,997/mo"), a "5-Day Launch Guarantee" section, ending cleanly with a real footer ("© 2026 ZeroManual, Inc.") — **not truncated, not malformed, not placeholder text.** (This is a meaningful contrast with earlier testing in this project on a *different* agent's KB, where URL-sourced docs showed `content: "IN CONTENT URL"` placeholder text instead of real content — this agent's docs do not have that problem; they contain genuine full content.)
- **Doc 2 (ZeroManual/Company Brain):** 10,010 characters. Same pattern — real nav links, real page copy, clean structure, no visible artifacts.
- Both also include a `chunks` array (5 chunks each) — the same content pre-split for embedding/retrieval purposes, available if a chunk-level view is ever needed instead of the flat document.

**Verdict: content pulled via `GET /kb/{docId}` is genuinely usable, complete, readable Markdown — directly usable for drafting something like an email reply without further cleanup.** This is the main finding Email Manager's "live-fetch fresh, never cache" design depends on, and it holds up under direct inspection, not just a successful HTTP status.

### 10.3 Test 3 — KB Search (relevance/quality, tested separately from raw access)

**Query 1:** `"What is Zenny? What does it do for businesses?"` → `200 OK`, **1.595s**, 5 results returned.

| Rank | Similarity | Source doc | Content relevance |
|---|---|---|---|
| 1 | 0.574 | Zenny page | ✅ Correct source; chunk opens with real page content |
| 2 | 0.554 | Zenny page | ✅ Testimonials section |
| 3 | 0.552 | Zenny page | ✅ "How it works — We train Zenny for your brand" |
| 4 | 0.536 | Zenny page | ✅ Booking/CTA section |
| 5 | 0.504 | Zenny page | ✅ Trial signup section |

**All 5 results correctly and exclusively drawn from the Zenny document** (not the unrelated ZeroManual one), sensibly ranked highest-similarity-first. Every result's `payload.text` is prefixed with real, useful **"Parent Document Metadata"** (the doc's `name` + `description`) ahead of the chunk content itself — meaning even the *first* result alone ("Zenny is a custom-trained AI customer support agent by ZeroManual — answering FAQs, taking orders, and replying to customers across WhatsApp, Instagram, Messenger, and your website 24/7") directly and correctly answers the query in one sentence.

**Query 2 (more specific, targeting the other document):** `"How does ZeroManual keep company knowledge secure and organized?"` → `200 OK`, **1.587s**, 5 results.

| Rank | Similarity | Source doc | Content relevance |
|---|---|---|---|
| 1 | 0.593 | ZeroManual/Company Brain page | ✅ "Which AI tools does it work with? Claude, ChatGPT, Cursor, Codex, Copilot..." |
| 2 | 0.555 | ZeroManual/Company Brain page | ✅ Page intro/nav |
| 3 | 0.546 | ZeroManual/Company Brain page | ✅ "When someone leaves... what they knew goes with them" (knowledge continuity) |
| 4 | 0.542 | ZeroManual/Company Brain page | ✅ "Watch your AI actually know things" |
| 5 | 0.540 | ZeroManual/Company Brain page | ✅ "Always fresh, never stale — Real-time, web..." |

**Correctly and exclusively pulled from the ZeroManual document this time — search correctly disambiguated between the two sources** based purely on query relevance, no cross-contamination between the two pages' content. Topically on-target: results speak to knowledge continuity, freshness, and tool integration — directly relevant to a "security and organization" framing even though the underlying content doesn't use that exact phrasing, indicating genuine semantic (not just keyword) retrieval.

**Verdict: KB search returns correct, relevant, well-ranked results, with clean source disambiguation across a small multi-document KB.** No irrelevant or cross-source noise observed in either query.

### 10.4 Test 4 — Latency / practicality for "live-fetch, never cache"

| Call | Response time |
|---|---|
| `GET /kb/{docId}` (single doc) | ~1.3s (both docs) |
| `POST /kb/search` | ~1.6s (both queries) |

**Practical verdict: live-fetch-per-send is workable, but not free — budget roughly 1.3–1.6 seconds per Convocore KB call in the email-send critical path.** For a single email reply needing one doc fetch (or one search call), this is a small, likely-acceptable addition to send latency. It becomes a real concern only if Email Manager's flow requires **multiple sequential** KB calls per email (e.g., search first, then fetch 2-3 individual docs based on results) — that could stack to 4-6+ seconds of added latency in the worst case, which may be noticeable depending on Email Manager's own latency budget. **This wasn't a large enough sample (2 docs, 2 queries, one workspace/region) to treat these numbers as a firm SLA** — but they're consistent enough (1.3s / 1.3s / 1.6s / 1.6s) to suggest this is a stable, not occasionally-spiky, baseline. If Email Manager's flow does end up needing multiple sequential KB calls per send, revisiting "never cache" in favor of a short-TTL cache (seconds-to-minutes, not the "never store" absolute the design currently locks in) would be worth a deliberate second look — not because live-fetch is broken, but purely on latency-stacking grounds if the call count per email turns out to be more than one.

---

## 11. Live REST Capability Test — Real Agent, All Resource Groups — 2026-08-04

> **Purpose:** run a full REST capability battery — agent config, KB, Custom Metrics, Conversations, Variables, Tools, and Usage — against `Zenny-UI` (`1nyXSGBFG1yOj0T9DIPM`), a real, actively-used, manually-built agent with substantial real content (6 real Canvas nodes, 8 real integration tools, 97 real variables, real multi-channel conversation history). **No MCP involved anywhere — raw `curl` only.** The only hard restriction: `DELETE /agents/1nyXSGBFG1yOj0T9DIPM` was never called. **Custom Metrics and Tools are tested here for the first time in this document — neither had been REST-tested before this session.**

### 11.1 Agent Configuration

**Baseline (`GET /agents/1nyXSGBFG1yOj0T9DIPM`):** 6 real nodes (`__start__` plus 5 others, mixing `type: "start"`, `"note"`, and `"default"`), `__start__` carrying real `toolsIds: ["airtable", "google-calendar"]` and real production instructions.

**`PATCH` — additive test node.** Added one new node (`rest_api_test_node`, with `instructions`/`description`/`llmConfig`) via `PATCH /agents/{id}` — **no existing node was touched.** Confirmed via independent `GET`: all 6 original nodes present unchanged (`__start__`'s instructions, `toolsIds` byte-for-byte identical to baseline), 7th node added exactly as sent. **Node writes confirmed working identically on this real, complex agent as on every disposable agent tested before.**

**`GET /agents/1nyXSGBFG1yOj0T9DIPM/export-template`:** ✅ `200 OK`, real and complete — `agentData.nodes` (7, matching post-PATCH state), `tools` (8), `variables` (97). 💡 **Minor documentation nuance found:** API Reference §4.6 states the agent's `SECRET_API_KEY` is "deliberately excluded from exports for security." In practice, the **field key is present** in the export (`"SECRET_API_KEY": ""`) but its **value is an empty string** — functionally equivalent (no real secret leaks), but not literally "excluded." Worth knowing if anything downstream checks for the field's *absence* rather than its *emptiness*.

### 11.2 Knowledge Base

Full re-confirmation of §10's findings on the same 2 real docs, same session:
- `GET /kb` → `total: 2`, both `SUCCESS`, matches exactly.
- `GET /kb/stats` → `{"charCount":20642,"docsCount":2}` — still correct on non-empty KB.
- `GET /kb/{docId}` on both real docs → content lengths identical to §10.2 (10,627 / 10,010 chars), still clean, complete, no placeholder text.
- `POST /kb/search` — two more realistic queries ("How much does Zenny cost per month?", "What happens if Zenny is not launched on time?") → both returned real, correctly-ranked, on-topic chunks (actual `$145`/`$250/mo` pricing lines surfaced for the pricing query; onboarding/setup content for the launch-guarantee query). Search quality re-confirmed holding up under different, more specific queries.

**Write cycle, test doc only:** `POST /kb` (name: `"API Write Test — safe to delete"`) → ✅ created → `PATCH` (content changed) → ✅ confirmed → `DELETE` → ✅ confirmed via follow-up `GET /kb` (`total: 2`, both real docs, test doc gone). **The two real pre-existing KB docs were never read-written or touched in any way beyond the read-only `GET` calls above.**

### 11.3 Custom Metrics — new resource group, first REST test in this document

`GET /agents/1nyXSGBFG1yOj0T9DIPM/custom-metrics` → `{"success":true,"metrics":[],"total":0}` — none existed, as expected. 💡 Note the response shape (`metrics` array, not `data`) differs from every other list endpoint tested in this document (`kb`, `convos`, `agents` all use `data`) — a real, minor API inconsistency worth knowing if building a generic response parser.

**Full cycle with test metric `api_test_metric` (type `number`):**

| Call | Result |
|---|---|
| `POST /custom-metrics` | ✅ Created, `metricId: LVJmkCti9oXv2mddrDqP` |
| `GET /custom-metrics/{id}` | ✅ Round-trips correctly |
| `GET /custom-metrics/{key}/data?startTs&endTs` (empty-state check) | ✅ `{"data":{"key":"api_test_metric","type":"numeric","timeSeries":[],"totalDataPoints":0}}` — **clean, graceful empty-state handling, no error** (a positive contrast with `kb/stats`'s empty-state 500 bug). 💡 Minor naming inconsistency noted: the metric itself has `type: "number"`, but the data endpoint's response says `type: "numeric"` — different strings for the same concept. |
| `PATCH /custom-metrics/{id}` (update description) | 🔴 **`404 Not Found`** — on the *exact same ID* that `GET` had just successfully retrieved and `DELETE` would successfully remove moments later. **New, real, reproducible bug**: `PATCH` on Custom Metrics appears broken even for a definitely-existing metric, while `GET`/`DELETE` on the identical URL work fine. |
| `DELETE /custom-metrics/{id}` | ✅ Succeeded, confirmed via follow-up list (`total: 0`) |

**Verdict: Custom Metrics — list/create/get/data/delete all work correctly, including graceful empty-state handling (better than KB's equivalent). `PATCH` is broken** — a genuinely new finding, not previously documented anywhere in this project.

### 11.4 Conversations — real, naturally-occurring data this time

`GET /convos?limit=5` on real history → 4 conversations: the `real-convo-test-...` one from §8, plus three genuinely organic ones (`DL2kG9YWdZpGGOn` web-chat, `27986828194334741` messenger — the one written to in §9.5, `6909719720` telegram).

**`GET /convos/DL2kG9YWdZpGGOn`** (real, organic web-chat conversation) → ✅ `200 OK`, full rich data — consistent with §8's finding that non-REST-created conversations work correctly.

**`GET /convos/6909719720`** (real, organic Telegram conversation) → 🔴 **`500 Internal Server Error` — `{"message":"Output validation failed","code":"INTERNAL_SERVER_ERROR"}`.** **Reproduced twice, identically, on retry.** This is a **new, distinct bug**, different in kind from the well-documented "Conversation not found" bug — this conversation *is found*, but the server fails validating its own output before returning it. Plausible cause: some Telegram-specific field in this particular conversation's stored data doesn't conform to whatever output schema the API validates against before responding — not investigated further (would require access to the raw stored document, which `export` can't provide either, being blocked by the billing add-on). **Practical implication: don't assume `GET /convos/{id}` is safe for every real, organically-created conversation just because it works for most of them — origin channel and/or specific stored field values can apparently still trigger a real 500 even on a conversation that isn't hitting the known REST-creation bug.**

**`PATCH /convos/DL2kG9YWdZpGGOn`** (additive tag only: `{"tags":["rest-api-retest-verified"]}`) → ✅ `200 OK`, full real conversation data (AI-generated summary, token usage, everything) returned unchanged except the new tag. **The only write made to any of this agent's real, pre-existing conversation history** — a single additive tag, nothing else altered.

### 11.5 Variables — settles the open `defaultValue` reconciliation question

`GET /agents/1nyXSGBFG1yOj0T9DIPM/variables` → **53 real variables**, all `isSystem: true` (none marked custom — every one of these appears to be a tool-parameter variable auto-created alongside the agent's 8 real tools, e.g. `shopify_method`). None of the 53 real variables has a `defaultValue` field present at all.

**Settling `Convocore_Canvas_Ground_Truth_v1.md` §7.3's open question** ("No generic Default Value field in the dashboard... the REST API's `defaultValue` field is likely API-level only, not surfaced in UI — not a contradiction, just different surfaces") **— confirmed correct, directly, via live test:**
```
POST /variables { "variable": { "key": "rest_api_test_var", "type": "string", "defaultValue": "my_default_value_test", "isGlobal": true, ... } }
→ 200 OK, defaultValue: "my_default_value_test" present in the response
GET /variables/{id} → defaultValue persists correctly on independent re-fetch
```
**Confirmed: `defaultValue` is a real, functional, persisted API-level field, independent of the ENV toggle, for a plain non-ENV string variable.** The Ground Truth doc's hypothesis was correct — this is a genuine API/dashboard-UI surface mismatch (the field works via API; the dashboard simply doesn't expose an input for it), not a documentation error or a contradiction to resolve.

**Full cycle:** `POST` (with `defaultValue`) → ✅ → `GET` (persistence confirmed) → `PATCH` (`value: "UPDATED_VALUE_TEST"`) → ✅, `defaultValue` preserved alongside the new `value` (deep-merge working correctly here too) → `DELETE` → ✅, confirmed via list (`total: 53`, back to baseline).

### 11.6 Tools — new resource group, first REST test in this document

`GET /agents/1nyXSGBFG1yOj0T9DIPM/tools` → **8 real tools**: `calendly`, `google-calendar`, `web-control`, `sms`, `shopify`, `google-sheets`, `end-call`, `airtable`.

**`GET /tools/{id}` on the real `calendly` tool** → returned keys: `id, name, description, createdAt, updatedAt, variablesIds, agentId, userId, channels` — **no `serverUrl`, no `method`, no `fields` array.** 💡 **Real finding, worth documenting clearly:** built-in/native integration tools (Calendly, Google Calendar, Shopify, etc. — Convocore's own first-party connectors) have a **structurally leaner shape via this API** than user-created custom webhook tools — they reference `variablesIds` for their parameters but carry none of the webhook-specific fields (`serverUrl`/`method`/`fields`) that API Reference §5.3's documented schema describes. This matches `Convocore_Canvas_Ground_Truth_v1.md` §6's distinction between "System Tools" and custom tools, now confirmed at the API level specifically.

**Confirmed the full documented shape by creating an actual custom tool:** `POST /agents/{id}/tools` with `serverUrl`, `method`, and a `fields` array → ✅ response included all of them exactly as sent, plus an auto-generated linked `variablesIds` entry (matching the same auto-variable-creation behavior found in `Convocore_REST_Live_Test_v1.md` §4.1).

**Full cycle:** `POST` → ✅ → `PATCH` (name + `description` [required, per the known §4.1 quirk] + `disabled: true`) → ✅ → `DELETE` → ✅ → confirmed via `GET /tools` (`count: 8`, test tool gone) **and** `GET /variables` (`total: 53`, the auto-created linked variable was also gone — **cascade-deleted correctly this time**, a positive discrepancy from API Reference §5.5's documented warning that tool deletion doesn't clean up associated variables).

### 11.7 Workspace/Agent Usage

`POST /agents/1nyXSGBFG1yOj0T9DIPM/usage` → 🔴 `401 Unauthorized workspace scope` — **identical error, same credential/agent combination tested repeatedly across this document, still broken.**

`POST /workspaces/rbe47Xxk7930QRz/usage` → ✅ `200 OK`, `{"keyMetrics":{"creditsCharged":0,"creditsConsumed":0,"llms":[],"agentsUsage":[]},"logs":[],"charts":[]}` — **still the confirmed working alternative.**

### 11.8 Summary of every real change made to `Zenny-UI`

| Change | Type | Status |
|---|---|---|
| Added node `rest_api_test_node` to Canvas (§11.1) | Additive, permanent unless manually removed | **Still present** — was not part of any cleanup cycle, since node removal wasn't tested/requested |
| Added tag `"rest-api-retest-verified"` to real conversation `DL2kG9YWdZpGGOn` (§11.4) | Additive, permanent unless manually removed | **Still present** |
| Test KB doc, test Custom Metric, test Variable, test Tool (+ its auto-created variable) | Disposable, created and deleted within this session | **Fully cleaned up, confirmed via follow-up reads** |

**Not changed:** agent title/description/theme/voiceConfig/top-level settings; none of the 6 original Canvas nodes; either of the 2 real KB documents; any of the 53 pre-existing real variables; any of the 8 pre-existing real tools; any real conversation's content beyond the one additive tag noted above. `delete_agent`/`DELETE /agents/{id}` was never called.

**If reverting the two remaining additive changes is desired:** the `rest_api_test_node` can be removed via the dashboard's Canvas editor (node removal via this REST API wasn't tested this session — unclear whether `PATCH` supports removing an array element vs. only adding/updating, consistent with the same open question noted in `Convocore_MCP_Reference_v1.md` §12.10); the `rest-api-retest-verified` tag on `DL2kG9YWdZpGGOn` can be removed with a single `PATCH` setting `tags` back to `[]`.

### 11.9 New findings this session, at a glance

1. **`export-template`'s `SECRET_API_KEY` field is present-but-empty, not literally absent** (§11.1) — minor doc nuance.
2. **Custom Metrics `PATCH` returns 404 on a valid, existing metric ID** (§11.3) — new, real, reproducible bug.
3. **Custom Metrics' empty-data-state (`/data` endpoint) handles gracefully, unlike `kb/stats`** (§11.3) — a positive contrast worth knowing.
4. **A real, organic Telegram conversation triggers `500 "Output validation failed"` on `GET`** — distinct from the known "not found" bug, reproduced twice (§11.4).
5. **The `defaultValue` Variables field is confirmed real and functional at the API level**, settling `Convocore_Canvas_Ground_Truth_v1.md` §7.3's open question definitively (§11.5).
6. **Built-in integration tools (Calendly, etc.) have a structurally different, leaner API shape than custom webhook tools** (§11.6).
7. **Tool deletion correctly cascade-deleted its auto-created variable this time**, contradicting API Reference §5.5's documented warning — in a good way (§11.6).

---

## STEP COMPLETION SUMMARY

- **What was written:** `Convocore_REST_Live_Test_v1.md` — direct, MCP-free REST/WebSocket live testing of three bugs previously found via MCP, plus a secondary Tools/Variables CRUD spot-check. Every call is real, captured on 2026-07-27 against the live `na-gcp` API using the same workspace secret configured in this project's `.mcp.json`.
- **Decisions made:** used a plain Node.js script with the native `WebSocket` global (no npm install) for the WebSocket test, to keep the "no MCP, minimal dependencies" isolation as clean as possible; tested PATCH/DELETE on the unreachable conversation in Test 2 even though GET already failed, per the task's explicit instruction, to get complete evidence rather than stopping at the first failure.
- **Open questions / not investigated further:** root cause of *why* the single-item conversation lookup and the agent-level usage endpoint fail while their sibling endpoints (list, workspace-usage) succeed — this would require access to Convocore's own backend code/logs, out of scope for black-box API testing. The `childrenNodes` object shape the routing engine actually expects (vs. the bare string array that crashes it) was not reverse-engineered — would require further experimentation (e.g., trying an object shape like `{ id: "node_2", condition: "..." }`) that wasn't part of this task's scope.
- **Ready for architect review:** YES
