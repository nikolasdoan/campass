// Partner leads (migrations/0007): shops near each campus that are not CampusPass partners yet,
// from 財政部's open business registry, for the team to approach. Admin-only (/admin/*, behind
// ADMIN_TOKEN); never part of the app or a public API. Sole proprietors and partnerships are
// natural persons and exist here only as counts (partner_lead_counts), never by name.

export const LEAD_STATUSES = ["new", "contacted", "interested", "partner", "not_interested", "do_not_contact"] as const;
export const LEAD_SOURCE =
  "財政部 全國營業(稅籍)登記資料集 (https://data.gov.tw/dataset/9400), 政府資料開放授權條款-第1版";

export type LeadQuery = { campus?: string; category?: string; status?: string; q?: string; limit?: number; offset?: number };

const SELECT = `SELECT l.ban, l.campus, l.category, l.name, l.address, l.industry, l.org_type, l.founded,
  l.distance_m, COALESCE(s.status, 'new') AS status, COALESCE(s.note, '') AS note, s.updated_at,
  l.source_date
  FROM partner_leads l LEFT JOIN partner_lead_status s ON s.ban = l.ban`;

// Do-not-contact rows sort after the rest of their campus (and category, in the CSV), so a list read
// top-down for calls reaches every lead worth calling first.
const DNC_LAST = "COALESCE(s.status, 'new') = 'do_not_contact'";

function where(q: LeadQuery): { sql: string; args: unknown[] } {
  const parts: string[] = [];
  const args: unknown[] = [];
  if (q.campus) parts.push("l.campus = ?"), args.push(q.campus);
  if (q.category) parts.push("l.category = ?"), args.push(q.category);
  if (q.status) parts.push("COALESCE(s.status, 'new') = ?"), args.push(q.status);
  if (q.q) parts.push("(l.name LIKE ? OR l.address LIKE ?)"), args.push(`%${q.q}%`, `%${q.q}%`);
  return { sql: parts.length ? ` WHERE ${parts.join(" AND ")}` : "", args };
}

/** One page of leads (nearest first), the total, and the per-campus summary with the counted-only groups. */
export async function listLeads(db: D1Database, q: LeadQuery) {
  const w = where(q);
  const limit = Math.min(Math.max(q.limit ?? 50, 1), 200);
  const offset = Math.max(q.offset ?? 0, 0);
  const [rows, total, named, counted, date] = await Promise.all([
    db.prepare(`${SELECT}${w.sql} ORDER BY l.campus, ${DNC_LAST}, l.distance_m IS NULL, l.distance_m, l.name LIMIT ? OFFSET ?`)
      .bind(...w.args, limit, offset).all(),
    db.prepare(`SELECT COUNT(*) AS n FROM partner_leads l LEFT JOIN partner_lead_status s ON s.ban = l.ban${w.sql}`)
      .bind(...w.args).first<{ n: number }>(),
    db.prepare("SELECT campus, category, COUNT(*) AS n FROM partner_leads GROUP BY campus, category ORDER BY campus, category").all(),
    db.prepare("SELECT campus, category, n FROM partner_lead_counts ORDER BY campus, category").all(),
    db.prepare("SELECT MAX(source_date) AS d FROM partner_leads").first<{ d: string | null }>(),
  ]);
  return {
    source: LEAD_SOURCE,
    source_date: date?.d ?? null,
    total: total?.n ?? 0,
    leads: rows.results,
    summary: { listed: named.results, sole_or_partnership: counted.results },
  };
}

/** Every lead matching the filters, for the CSV export (do-not-contact rows included, so the list stays honest). */
export async function exportLeads(db: D1Database, q: LeadQuery) {
  const w = where(q);
  const { results } = await db.prepare(`${SELECT}${w.sql} ORDER BY l.campus, l.category, ${DNC_LAST}, l.distance_m`).bind(...w.args).all();
  return results;
}

/** Sets a lead's status and/or note; false when the lead or the status is unknown. */
export async function updateLead(db: D1Database, ban: string, status: unknown, note: unknown): Promise<"ok" | "not_found" | "bad_status"> {
  if (status !== undefined && !(LEAD_STATUSES as readonly unknown[]).includes(status)) return "bad_status";
  const exists = await db.prepare("SELECT 1 FROM partner_leads WHERE ban = ?").bind(ban).first();
  if (!exists) return "not_found";
  const cleanNote = typeof note === "string" ? [...note.trim()].slice(0, 500).join("") : undefined;
  await db
    .prepare(
      `INSERT INTO partner_lead_status (ban, status, note, updated_at) VALUES (?, COALESCE(?, 'new'), COALESCE(?, ''), datetime('now'))
       ON CONFLICT (ban) DO UPDATE SET status = COALESCE(?, status), note = COALESCE(?, note), updated_at = datetime('now')`
    )
    .bind(ban, status ?? null, cleanNote ?? null, status ?? null, cleanNote ?? null)
    .run();
  return "ok";
}
