// Verifies the Auth0 ID token the client receives at sign-in, so the server
// only issues its own session token for an identity Auth0 vouched for.
const { createRemoteJWKSet, jwtVerify } = require("jose");
require("dotenv").config();

const keySets = new Map();

// Auth0's signing keys, fetched once and cached (jose refreshes on rotation)
function remoteKeySet(domain) {
  if (!keySets.has(domain)) {
    keySets.set(
      domain,
      createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`))
    );
  }
  return keySets.get(domain);
}

function auth0Config() {
  return {
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    // set AUTH0_REQUIRE_VERIFIED_EMAIL=false only if your Auth0 connection
    // can't verify emails; otherwise anyone could sign up as someone else
    requireVerifiedEmail: process.env.AUTH0_REQUIRE_VERIFIED_EMAIL !== "false",
  };
}

class Auth0VerificationError extends Error {}

// returns { email, sub } or throws Auth0VerificationError.
// `keySet` can be passed in for tests; it defaults to the tenant's JWKS.
async function verifyAuth0IdToken(idToken, options = {}) {
  const { domain, clientId, requireVerifiedEmail, keySet } = {
    ...auth0Config(),
    ...options,
  };

  if (!domain || !clientId) {
    throw new Error("AUTH0_DOMAIN and AUTH0_CLIENT_ID must be set on the server");
  }
  if (typeof idToken !== "string" || !idToken) {
    throw new Auth0VerificationError("Missing ID token");
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, keySet || remoteKeySet(domain), {
      issuer: `https://${domain}/`,
      audience: clientId,
      // Auth0 signs ID tokens with RS256; never accept HS256 here
      algorithms: ["RS256"],
      clockTolerance: 60,
    }));
  } catch (err) {
    throw new Auth0VerificationError(`Invalid ID token: ${err.code || err.message}`);
  }

  if (!payload.email) {
    throw new Auth0VerificationError("ID token has no email");
  }
  if (requireVerifiedEmail && payload.email_verified !== true) {
    throw new Auth0VerificationError("Email address is not verified");
  }

  return { email: String(payload.email).trim().toLowerCase(), sub: payload.sub };
}

module.exports = { verifyAuth0IdToken, Auth0VerificationError };
