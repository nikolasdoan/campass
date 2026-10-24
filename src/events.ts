// Anonymous usage counts (founder decision 2026-10-24). The app batches what readers search for,
// which searches find nothing, and which filters and deals they open (public/js/track.js), and sends
// it to POST /api/events when the page is hidden. Only daily totals are stored (event_counts): no user
// id, IP or cookie, so a count never says who. Search text that could identify someone is dropped,
// and the dashboard lists a search only once it has been made at least SEARCH_MIN_SHOWN times.

const EVENT_KINDS = new Set(["search", "search_zero", "filter", "open"]);
const MAX_ITEMS = 50; // per request
const MAX_N = 20; // one page can't add more than this to any count
export const SEARCH_MIN_SHOWN = 3;

/** The stored key for an event, or null to drop it. */
export function eventKey(kind: string, key: unknown): string | null {
  if (typeof key !== "string") return null;
  if (kind === "open") return /^[0-9a-f]{10}$/.test(key) ? key : null;
  if (kind === "filter") return /^(cat|region|school|students):[A-Za-z_]{1,20}$/.test(key) ? key : null;
  const q = key.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 40);
  // Never keep what could identify someone: emails, links, phone or ID numbers, student IDs (b09902123).
  if (q.length < 2 || /@|https?:|www\.|\d{6,}|\b[a-z]\d{7,}\b/.test(q)) return null;
  return q;
}

/** Adds a request body's events ({ e: [[kind, key, n?], …] }) to the day's totals; false if malformed. */
export async function recordEvents(db: D1Database, body: any, day: string): Promise<boolean> {
  if (!Array.isArray(body?.e)) return false;
  const rows = new Map<string, [string, string, number]>();
  for (const item of body.e.slice(0, MAX_ITEMS)) {
    if (!Array.isArray(item) || !EVENT_KINDS.has(item[0])) continue;
    const key = eventKey(item[0], item[1]);
    if (!key) continue;
    const id = `${item[0]}\t${key}`;
    const n = Math.min(Math.max(Math.trunc(Number(item[2]) || 1), 1), MAX_N);
    rows.set(id, [item[0], key, Math.min((rows.get(id)?.[2] ?? 0) + n, MAX_N)]);
  }
  if (rows.size) {
    await db.batch(
      [...rows.values()].map(([kind, key, n]) =>
        db.prepare(
          `INSERT INTO event_counts (day, kind, key, n) VALUES (?, ?, ?, ?)
           ON CONFLICT (day, kind, key) DO UPDATE SET n = n + excluded.n`
        ).bind(day, kind, key, n)
      )
    );
  }
  return true;
}

/** The admin dashboard's anonymous section, from `since` (YYYY-MM-DD) on. */
export async function eventStats(db: D1Database, since: string) {
  const counted = (kind: string, limit: number, min = 1) =>
    db
      .prepare(
        `SELECT key, SUM(n) AS n FROM event_counts WHERE kind = ? AND day >= ?
          GROUP BY key HAVING SUM(n) >= ? ORDER BY n DESC, key LIMIT ?`
      )
      .bind(kind, since, min, limit)
      .all();
  const [searches, zero, filters, opened] = await Promise.all([
    counted("search", 20, SEARCH_MIN_SHOWN),
    counted("search_zero", 20, SEARCH_MIN_SHOWN),
    counted("filter", 40),
    db
      .prepare(
        `SELECT d.name, SUM(e.n) AS opens FROM event_counts e JOIN deals d ON d.id = e.key
          WHERE e.kind = 'open' AND e.day >= ? GROUP BY e.key ORDER BY opens DESC LIMIT 20`
      )
      .bind(since)
      .all(),
  ]);
  return {
    top_searches: searches.results,
    searches_no_results: zero.results,
    filters: filters.results,
    top_opened: opened.results,
  };
}
