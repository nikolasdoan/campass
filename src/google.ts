// Google OAuth 2.0 / OpenID Connect (authorization code flow with PKCE).

export type GoogleEndpoints = { auth: string; token: string };

export const GOOGLE_ENDPOINTS: GoogleEndpoints = {
  auth: "https://accounts.google.com/o/oauth2/v2/auth",
  token: "https://oauth2.googleapis.com/token",
};

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function newPkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

export function googleAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  challenge: string;
  endpoints?: GoogleEndpoints;
}) {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: opts.state,
    code_challenge: opts.challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${(opts.endpoints ?? GOOGLE_ENDPOINTS).auth}?${params}`;
}

function decodeJwtPayload(jwt: string): Record<string, any> {
  const part = jwt.split(".")[1];
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
  const bin = atob(b64);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
}

/**
 * Exchange the authorization code for tokens and return the user's profile.
 * The ID token comes straight from Google's token endpoint over TLS, so per
 * Google's OIDC guidance its signature need not be re-verified; we still check
 * issuer, audience and expiry.
 */
export async function exchangeCode(opts: {
  code: string;
  verifier: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  endpoints?: GoogleEndpoints;
}) {
  const res = await fetch((opts.endpoints ?? GOOGLE_ENDPOINTS).token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      grant_type: "authorization_code",
      code_verifier: opts.verifier,
    }),
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}: ${await res.text()}`);
  const { id_token } = await res.json<{ id_token: string }>();
  const claims = decodeJwtPayload(id_token);

  if (!["https://accounts.google.com", "accounts.google.com"].includes(claims.iss)) throw new Error("bad iss");
  if (claims.aud !== opts.clientId) throw new Error("bad aud");
  if (claims.exp * 1000 < Date.now()) throw new Error("expired id_token");

  return {
    sub: String(claims.sub),
    email: String(claims.email),
    email_verified: claims.email_verified === true || claims.email_verified === "true",
    name: claims.name as string | undefined,
    picture: claims.picture as string | undefined,
  };
}
