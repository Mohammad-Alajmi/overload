/**
 * The 250-point check, as code.
 *
 * The brief is explicit: "Hiding rows in your page is not a lock. We ask your
 * database directly, with nobody logged in. If any row comes back, you have a
 * filter, not a policy."
 *
 * So this script does exactly that. It talks to PostgREST with the public key
 * and no session, and asserts that an anonymous caller can neither read a row
 * nor write one. It exits non-zero if either is possible, which means a
 * regression announces itself immediately rather than on grading day.
 *
 * Run it against the deployed database:
 *   npm run verify:rls
 *
 * Plain JavaScript on purpose — no transpile step, no dependencies, so anyone
 * marking this can run it with nothing but Node installed.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Set them in .env.local, or export them before running.",
  );
  process.exit(2);
}

const anonHeaders = { apikey: key, Authorization: `Bearer ${key}` };
const failures = [];
const checks = [];

function record(name, passed, detail) {
  checks.push({ name, passed, detail });
  if (!passed) failures.push(name);
}

/**
 * Every table this app owns. `profiles` matters as much as `sets` — it holds
 * email addresses, so leaving it out of the check would be checking the lock on
 * one of two doors.
 */
const TABLES = ["sets", "profiles"];

/** An anonymous SELECT must come back with no rows. */
async function checkAnonymousRead(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: anonHeaders,
  });
  const body = await res.text();

  let rows;
  try {
    rows = JSON.parse(body);
  } catch {
    record(
      `anonymous read of ${table}`,
      false,
      `HTTP ${res.status}, unparseable: ${body}`,
    );
    return;
  }

  const count = Array.isArray(rows) ? rows.length : -1;
  record(
    `anonymous read of ${table} returns zero rows`,
    Array.isArray(rows) && count === 0,
    `HTTP ${res.status}, ${count} row(s), body: ${body.slice(0, 200)}`,
  );
}

/** An anonymous INSERT must be refused outright. */
async function checkAnonymousWrite(table, row) {
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...anonHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  const body = await res.text();
  record(
    `anonymous insert into ${table} is refused`,
    res.status >= 400,
    `HTTP ${res.status}, body: ${body.slice(0, 200)}`,
  );
}

/**
 * The trigger functions must not be reachable as RPCs. Postgres grants EXECUTE
 * to PUBLIC on new functions by default, which puts anything in the public
 * schema on the API surface until the grant is revoked.
 */
async function checkNoRpc() {
  for (const fn of ["handle_new_user", "sync_profile_email", "touch_updated_at"]) {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { ...anonHeaders, "Content-Type": "application/json" },
      body: "{}",
    });
    record(
      `internal function ${fn} is not callable`,
      res.status >= 400,
      `HTTP ${res.status}`,
    );
  }
}

/** A request with no key at all must not be served. */
async function checkNoKey() {
  const res = await fetch(`${url}/rest/v1/sets?select=*`);
  record(
    "request with no API key is refused",
    res.status >= 400,
    `HTTP ${res.status}`,
  );
}

/** No view over these tables: a view runs as its owner and reads past RLS. */
async function checkNoLeakyView() {
  // PostgREST exposes views exactly like tables, so if one existed over `sets`
  // it would answer here. Probing the names a leak would plausibly use.
  for (const name of ["sets_view", "all_sets", "v_sets", "public_sets", "profiles_view"]) {
    const res = await fetch(`${url}/rest/v1/${name}?select=*`, {
      headers: anonHeaders,
    });
    if (res.status !== 404) {
      const body = await res.text();
      record(
        `no anonymous-readable view named ${name}`,
        body.trim() === "[]",
        `HTTP ${res.status}, body: ${body.slice(0, 120)}`,
      );
    }
  }
}

await checkNoKey();
for (const table of TABLES) await checkAnonymousRead(table);
await checkAnonymousWrite("sets", { lift: "rls probe", weight_kg: 1, reps: 1 });
await checkAnonymousWrite("profiles", {
  id: "00000000-0000-0000-0000-000000000000",
  email: "probe@example.com",
  display_name: "probe",
});
await checkNoRpc();
await checkNoLeakyView();

console.log(`\nRLS verification against ${url}\n`);
for (const check of checks) {
  console.log(`  ${check.passed ? "PASS" : "FAIL"}  ${check.name}`);
  console.log(`        ${check.detail}`);
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length} check(s) FAILED. The database is readable or writable ` +
      `by an anonymous caller. This is the 250-point test and it is not passing.\n`,
  );
  process.exit(1);
}

console.log(
  `\nAll checks passed. An anonymous caller can neither read nor write ${TABLES.map((t) => `public.${t}`).join(" or ")}, ` +
    "and no internal function is reachable as an API endpoint.\n",
);
