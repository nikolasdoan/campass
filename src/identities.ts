// School identities ("CampusPass cards"): one account can hold several, each verified separately.
// A verified school email proves which school; the role (student/staff/alumni) is declared by the user.

/** Mail domains per school. A domain matches its base or any subdomain (g.ntu.edu.tw → NTU), with a
 *  dot boundary, so ntnu.edu.tw never matches ntu.edu.tw. Subdomains seen for student accounts include
 *  g.ntu, gapp.nthu, smail/mail.nchu, gs.ncku, cc/g.ncu, gms.tcu, gapps.ntnu, mail/gapps.ntust. */
export const SCHOOL_DOMAINS: Record<string, string[]> = {
  NTU: ["ntu.edu.tw"],
  NTNU: ["ntnu.edu.tw"],
  NTUST: ["ntust.edu.tw"],
  NCCU: ["nccu.edu.tw"],
  NTHU: ["nthu.edu.tw"],
  NYCU: ["nycu.edu.tw", "nctu.edu.tw", "ym.edu.tw"],
  NCKU: ["ncku.edu.tw"],
  NCU: ["ncu.edu.tw"],
  NCHU: ["nchu.edu.tw"],
  TMU: ["tmu.edu.tw"],
  TCU: ["tcu.edu.tw"],
  CMU: ["cmu.edu.tw"],
  KSU: ["ksu.edu.tw"],
};

export function schoolForDomain(domain: string): string | null {
  const d = domain.toLowerCase();
  for (const [school, bases] of Object.entries(SCHOOL_DOMAINS)) {
    if (bases.some((b) => d === b || d.endsWith(`.${b}`))) return school;
  }
  return null;
}

export const ROLES = ["student", "staff", "alumni"] as const;
export const IDENTITY_DAYS = 365; // a card is re-verified once a year

export type Identity = {
  id: number;
  school: string;
  role: string;
  email: string;
  method: string;
  verified_at: string;
  expires_at: string;
  active: boolean;
};

/** Add or re-verify the identity for this school email on this account. Returns the school, or null
 *  when the email's domain isn't a known school. */
export async function addIdentity(db: D1Database, userId: number, email: string, method: "google" | "dev") {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const school = schoolForDomain(domain);
  if (!school) return null;
  await db
    .prepare(
      `INSERT INTO user_identities (user_id, school, email, email_domain, method, verified_at, expires_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now', ?))
       ON CONFLICT(user_id, school, email) DO UPDATE SET
         method = excluded.method, verified_at = excluded.verified_at, expires_at = excluded.expires_at`
    )
    .bind(userId, school, email.toLowerCase(), domain, method, `+${IDENTITY_DAYS} days`)
    .run();
  return school;
}

export async function listIdentities(db: D1Database, userId: number): Promise<Identity[]> {
  const { results } = await db
    .prepare(
      `SELECT id, school, role, email, method, verified_at, expires_at, expires_at > datetime('now') AS active
         FROM user_identities WHERE user_id = ? ORDER BY verified_at DESC`
    )
    .bind(userId)
    .all<Omit<Identity, "active"> & { active: number }>();
  return results.map((r) => ({ ...r, active: !!r.active }));
}
