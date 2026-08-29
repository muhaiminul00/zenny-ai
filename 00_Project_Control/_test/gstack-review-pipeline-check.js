/**
 * SYNTHETIC TEST FIXTURE — pipeline health-check only.
 *
 * This file is NOT real Zenny code. It exists solely to verify that gstack's
 * `/review` skill actually detects planted issues in a real PR diff, as part
 * of a one-off test of the branch/PR/review pipeline (2026-08-29).
 *
 * It is never imported, never executed, and this branch is deleted and the
 * PR closed unmerged immediately after the review run completes. Do not
 * treat any pattern below as sanctioned — each is a deliberately planted
 * anti-pattern from gstack /review's own critical-pass categories.
 */

const { exec } = require("child_process");

// PLANTED ISSUE 1 — Shell Injection
// Untrusted input concatenated directly into a shell command string.
function pingHost(userSuppliedHost) {
  exec("ping -n 1 " + userSuppliedHost, (err, stdout) => {
    console.log(stdout);
  });
}

// PLANTED ISSUE 2 — SQL & Data Safety (string-concatenated query)
// Untrusted input concatenated directly into a SQL string instead of using
// a parameterized query / placeholder.
function getUserById(db, userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.query(query);
}

// PLANTED ISSUE 3 — Race Condition / unhandled async
// Two "concurrent" writes to the same record with no lock/transaction and
// no await on the first before starting the second — classic lost-update.
async function creditAndDebit(account, amount) {
  updateBalance(account, (bal) => bal + amount); // not awaited
  updateBalance(account, (bal) => bal - amount); // races with the line above
}

async function updateBalance(account, fn) {
  const current = await account.readBalance();
  const next = fn(current);
  await account.writeBalance(next);
}

module.exports = { pingHost, getUserById, creditAndDebit };
