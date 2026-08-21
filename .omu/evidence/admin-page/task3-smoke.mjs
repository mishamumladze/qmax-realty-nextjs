// Throwaway smoke test for task3 admin db helpers.
// Replicates the exact SQL of getAllProperties / updateProperty / deleteProperty /
// getAllMessages / getAllNewsletterSubscribers from src/lib/db.ts in plain JS,
// run against the real database data/qmax.sqlite. Cleans up its own row.
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "..", "..", "data", "qmax.sqlite");
const db = new Database(dbPath);

const JSON_COLUMNS = new Set(["inclusions", "gallery", "coords"]);
function toColumnValue(key, value) {
  if (JSON_COLUMNS.has(key)) return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

let testId = null;
let failures = 0;
function check(label, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? " -> " + detail : ""}`);
  if (!ok) failures++;
}

try {
  // 1) INSERT temp test property
  const insert = db.prepare(
    `INSERT INTO properties (slug, title, type, subtitle, location, city, price, currency, status, inclusions, gallery, coords)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const info = insert.run(
    "__task3_smoke_test__",
    "TASK3 SMOKE TEST PROPERTY",
    "apartment",
    "smoke subtitle",
    "Smoke Location 1",
    "Tbilisi",
    123456,
    "USD",
    "inactive",
    JSON.stringify(["item A", "item B"]),
    JSON.stringify(["/img/a.webp"]),
    JSON.stringify({ lat: 41.7, lng: 44.8 })
  );
  testId = Number(info.lastInsertRowid);
  check("insert temp property", true, `id=${testId}`);

  // 2) UPDATE via dynamic SET built only from present keys (replicates updateProperty)
  const data = {
    title: "TASK3 SMOKE TEST UPDATED",
    price: 999999,
    subtitle: "updated subtitle",
    inclusions: ["item C"],
    coords: { lat: 42.0, lng: 45.0 },
    parking: true,
  };
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const setClauses = [];
  const values = [];
  for (const [key, value] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(toColumnValue(key, value));
  }
  const updInfo = db
    .prepare(`UPDATE properties SET ${setClauses.join(", ")} WHERE id = ?`)
    .run(...values, testId);
  check("update affected row", updInfo.changes === 1, `changes=${updInfo.changes}`);

  // 3) SELECT to prove update took effect
  const row = db.prepare("SELECT * FROM properties WHERE id = ?").get(testId);
  check("title updated", row.title === "TASK3 SMOKE TEST UPDATED", row.title);
  check("price updated", row.price === 999999, String(row.price));
  check("subtitle updated", row.subtitle === "updated subtitle", row.subtitle);
  check(
    "inclusions serialized as JSON",
    row.inclusions === JSON.stringify(["item C"]),
    row.inclusions
  );
  check(
    "coords serialized as JSON",
    row.coords === JSON.stringify({ lat: 42.0, lng: 45.0 }),
    row.coords
  );
  // NOTE: live column stores bound ints as text ("1.0"); assert persisted truthy form
  check(
    "parking boolean persisted",
    row.parking !== null && /^1/.test(String(row.parking)),
    `${String(row.parking)} (typeof ${typeof row.parking})`
  );

  // update on missing id must affect nothing
  const missInfo = db.prepare(`UPDATE properties SET title = ? WHERE id = ?`).run("nope", -99999);
  check("update missing id affects 0 rows", missInfo.changes === 0, `changes=${missInfo.changes}`);

  // 4) DELETE and prove gone
  const delInfo = db.prepare("DELETE FROM properties WHERE id = ?").run(testId);
  check("delete affected row", delInfo.changes > 0, `changes=${delInfo.changes}`);
  const after = db.prepare("SELECT * FROM properties WHERE id = ?").get(testId);
  check("row gone after delete", after === undefined, String(after));
  const delAgain = db.prepare("DELETE FROM properties WHERE id = ?").run(testId);
  check("delete again affects 0 rows", delAgain.changes === 0, `changes=${delAgain.changes}`);
  testId = null; // cleaned up

  // 5) Counts for messages + subscribers (getAllMessages / getAllNewsletterSubscribers SQL)
  const msgCount = db.prepare("SELECT COUNT(*) AS c FROM messages").get().c;
  const subCount = db.prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers").get().c;
  const newestMsg = db
    .prepare("SELECT id, created_at FROM messages ORDER BY created_at DESC LIMIT 1")
    .get();
  const newestSub = db
    .prepare("SELECT id, created_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 1")
    .get();
  console.log(
    `messages count: ${msgCount} (newest: ${newestMsg ? `id=${newestMsg.id} created_at=${newestMsg.created_at}` : "none"})`
  );
  console.log(
    `newsletter_subscribers count: ${subCount} (newest: ${newestSub ? `id=${newestSub.id} created_at=${newestSub.created_at}` : "none"})`
  );

  // ordering sanity for getAllProperties SQL (created_at DESC, id DESC)
  const propsOrder = db
    .prepare("SELECT id, created_at FROM properties ORDER BY created_at DESC, id DESC LIMIT 3")
    .all();
  console.log(`properties top-of-list (newest first): ${JSON.stringify(propsOrder)}`);

  console.log(
    failures === 0 ? "SMOKE RESULT: ALL CHECKS PASSED" : `SMOKE RESULT: ${failures} CHECK(S) FAILED`
  );
  process.exitCode = failures === 0 ? 0 : 1;
} catch (err) {
  console.error("SMOKE ERROR:", err.message);
  process.exitCode = 1;
} finally {
  if (testId !== null) {
    db.prepare("DELETE FROM properties WHERE id = ?").run(testId);
    console.log(`cleanup: removed residual test row id=${testId}`);
  }
  db.close();
}
