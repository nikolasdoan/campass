// A tiny stand-in for Google's OAuth endpoints, so the real sign-in code path
// (state, PKCE, token exchange, ID-token checks) can be tested locally.
// Used only when .dev.vars has DEV_LOGIN=true and GOOGLE_MOCK_URL=http://localhost:9876.
//
//   node tests/mock-google.mjs            (listens on :9876)
//
// /auth shows an account picker. Special emails simulate failures:
//   deny@…        -> the user cancels (error=access_denied)
//   unverified@…  -> Google returns email_verified=false
import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";

const PORT = Number(process.env.MOCK_GOOGLE_PORT || 9876);
const codes = new Map(); // code -> {client_id, redirect_uri, challenge, email}

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const html = (body) =>
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mock Google</title>
<style>body{font:16px system-ui;max-width:420px;margin:40px auto;padding:0 16px}input,button{font:inherit;padding:10px;width:100%;box-sizing:border-box;margin-top:8px}</style>${body}`;

function idToken(clientId, email) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "https://accounts.google.com",
    aud: clientId,
    sub: `mock-${email}`,
    email,
    email_verified: !email.startsWith("unverified@"),
    name: email.split("@")[0],
    picture: "",
    iat: now,
    exp: now + 3600,
  };
  return [b64url(JSON.stringify({ alg: "none", typ: "JWT" })), b64url(JSON.stringify(payload)), "sig"].join(".");
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/auth") {
    const p = url.searchParams;
    const email = p.get("login_hint");
    if (!email) {
      // Account picker: re-submit to /auth with the chosen email as login_hint.
      const hidden = [...p].map(([k, v]) => `<input type="hidden" name="${k}" value="${v.replace(/"/g, "&quot;")}">`).join("");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(html(`<h1>Mock Google</h1><form method="get" action="/auth">${hidden}
        <label>Email<input name="login_hint" type="email" value="student@ntu.edu.tw" required></label>
        <button id="continue">Continue</button></form>`));
    }
    const back = new URL(p.get("redirect_uri"));
    back.searchParams.set("state", p.get("state") || "");
    if (email.startsWith("deny@")) {
      back.searchParams.set("error", "access_denied");
    } else {
      const code = b64url(randomBytes(16));
      codes.set(code, { client_id: p.get("client_id"), redirect_uri: p.get("redirect_uri"), challenge: p.get("code_challenge"), email });
      back.searchParams.set("code", code);
    }
    res.writeHead(302, { Location: back.toString() });
    return res.end();
  }

  if (req.method === "POST" && url.pathname === "/token") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const f = new URLSearchParams(body);
    const entry = codes.get(f.get("code"));
    codes.delete(f.get("code")); // codes are single-use, like Google's
    const fail = (error) => {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error }));
    };
    if (!entry) return fail("invalid_grant");
    if (f.get("client_id") !== entry.client_id || f.get("redirect_uri") !== entry.redirect_uri) return fail("invalid_client");
    if (!f.get("client_secret")) return fail("invalid_client");
    const challenge = b64url(createHash("sha256").update(f.get("code_verifier") || "").digest());
    if (challenge !== entry.challenge) return fail("invalid_grant"); // PKCE check
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ access_token: "mock", token_type: "Bearer", expires_in: 3600, id_token: idToken(entry.client_id, entry.email) }));
  }

  res.writeHead(404);
  res.end();
}).listen(PORT, () => console.log(`mock Google on http://localhost:${PORT}`));
